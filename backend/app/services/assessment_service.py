import os
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

from app.services.model_loader import (
    model as rf_model, 
    scaler as rf_scaler, 
    metadata as rf_metadata, 
    feature_columns as rf_feature_columns
)
from app.services.nutrition_calculator import calculate_daily_nutrition
from app.services.recommendation_service import get_dietary_recommendations
from app.ml.bayesian_updater import apply_bayesian_lab_updates
from app.ml.shap_explainer import compute_shap_explanations
from app.db.database import (
    save_assessment, 
    get_latest_assessment, 
    get_db, 
    get_food_by_id, 
    search_food_items,
    get_health_profile
)

logger = logging.getLogger("assessment_service")
logger.setLevel(logging.INFO)

# 11 Core Nutrients evaluated in the Assessment Pipeline
NUTRIENT_KEYS = [
    "calories_kcal", "protein_g", "iron_mg", "calcium_mg", "vitamin_d_mcg",
    "vitamin_b12_mcg", "folate_mcg", "vitamin_a_mcg", "vitamin_c_mg",
    "magnesium_mg", "zinc_mg"
]

def get_risk_level(probability: float) -> str:
    """
    Classifies a deficiency probability into UI risk bands:
      >= 0.66      -> High
      0.35 - 0.65  -> Moderate
      < 0.35       -> Low
    """
    if probability >= 0.66:
        return "High"
    elif probability >= 0.35:
        return "Moderate"
    else:
        return "Low"

def calculate_wellness_score(risk_probabilities: List[float]) -> float:
    """
    Calculates overall wellness score:
      wellness = round((1.0 - average_risk) * 100.0, 1) bounded in [0.0, 100.0]
    """
    if not risk_probabilities:
        return 100.0
    avg_risk = sum(risk_probabilities) / len(risk_probabilities)
    overall_score = round((1.0 - avg_risk) * 100.0, 1)
    return max(0.0, min(100.0, overall_score))

def get_diary_summary(
    logged_foods: List[Any], 
    food_db_map: Optional[Dict[str, Any]] = None,
    window_days: int = 7
) -> Dict[str, Any]:
    """
    Aggregates diary entries across distinct calendar days within the assessment window.
    Formula per nutrient:
      nutrient_logged = (nutrient_per_100g / 100) * portion_grams
      average_nutrient = sum(daily_totals) / N_distinct_logged_days
    """
    if food_db_map is None:
        try:
            food_db_map = {f["id"]: f for f in search_food_items(limit=1000)}
        except Exception:
            food_db_map = {}

    enriched_by_date: Dict[str, Dict[str, float]] = {}

    for idx, item in enumerate(logged_foods):
        # Extract item properties whether Pydantic schema or Dict
        food_id = getattr(item, "food_id", None) or (item.get("food_id") if isinstance(item, dict) else None)
        food_name = getattr(item, "food_name", None) or (item.get("food_name") if isinstance(item, dict) else "")
        # Handle both frontend (serving_g) and DB (portion_grams) field names
        serving_g = float(
            getattr(item, "serving_g", None) or 
            (item.get("serving_g") or item.get("portion_grams", 100.0) if isinstance(item, dict) else 100.0)
        )
        # Handle both frontend (date) and DB (entry_date) field names
        entry_date = (
            getattr(item, "date", None) or getattr(item, "entry_date", None) or
            (item.get("date") or item.get("entry_date") if isinstance(item, dict) else None)
        )
        
        # Fallback date if not provided
        if not entry_date:
            entry_date = f"Day_{(idx % 3) + 1}"

        scale = serving_g / 100.0
        
        # Lookup nutrient info from food database or item fields
        try:
            lookup_id = int(food_id) if food_id is not None else None
        except (ValueError, TypeError):
            lookup_id = food_id
        f_info = food_db_map.get(lookup_id) if lookup_id else None
        
        item_nutrients = {}
        for key in NUTRIENT_KEYS:
            if key == "vitamin_d_mcg":
                if isinstance(item, dict) and "vitamin_d_mcg" in item and item["vitamin_d_mcg"] is not None and float(item["vitamin_d_mcg"]) > 0:
                    val = float(item["vitamin_d_mcg"])
                elif isinstance(item, dict) and "vitamin_d_iu" in item and item["vitamin_d_iu"] is not None:
                    val = float(item["vitamin_d_iu"]) / 40.0
                elif f_info and "vitamin_d_mcg" in f_info and f_info["vitamin_d_mcg"] is not None:
                    val = float(f_info["vitamin_d_mcg"]) * scale
                elif f_info and "vitamin_d_iu" in f_info and f_info["vitamin_d_iu"] is not None:
                    val = (float(f_info["vitamin_d_iu"]) / 40.0) * scale
                elif hasattr(item, "vitamin_d_mcg") and getattr(item, "vitamin_d_mcg", 0):
                    val = float(getattr(item, "vitamin_d_mcg", 0))
                elif hasattr(item, "vitamin_d_iu") and getattr(item, "vitamin_d_iu", 0):
                    val = float(getattr(item, "vitamin_d_iu", 0)) / 40.0
                else:
                    val = 0.0
            elif isinstance(item, dict) and key in item and item[key] is not None:
                val = float(item[key])
            elif isinstance(item, dict) and key == "calories_kcal" and "calories" in item and item["calories"] is not None:
                val = float(item["calories"])
            elif f_info and key in f_info and f_info[key] is not None:
                val = float(f_info[key]) * scale
            elif f_info and key == "calories_kcal" and "calories" in f_info:
                val = float(f_info["calories"]) * scale
            else:
                attr_val = getattr(item, key, None)
                val = float(attr_val) if attr_val is not None else 0.0
            item_nutrients[key] = val

        if entry_date not in enriched_by_date:
            enriched_by_date[entry_date] = {k: 0.0 for k in NUTRIENT_KEYS}

        for key in NUTRIENT_KEYS:
            enriched_by_date[entry_date][key] += item_nutrients[key]

    distinct_days = len(enriched_by_date)
    n_days = max(1, distinct_days)

    # Compute daily averages across distinct logged days
    daily_averages = {
        key: sum(enriched_by_date[d][key] for d in enriched_by_date) / n_days
        for key in NUTRIENT_KEYS
    }

    daily_totals = {
        key: sum(enriched_by_date[d][key] for d in enriched_by_date)
        for key in NUTRIENT_KEYS
    }

    return {
        "distinct_days": distinct_days,
        "distinct_dates": list(enriched_by_date.keys()),
        "daily_averages": daily_averages,
        "daily_totals": daily_totals,
        "enriched_by_date": enriched_by_date
    }

def build_feature_dict(profile: Any, daily_averages: Dict[str, float]) -> Dict[str, float]:
    """
    Builds the exact 13-feature input dictionary required by the Random Forest model:
      1. gender (1=Male, 2=Female)
      2. age_years
      3. calories_kcal
      4. protein_g
      5. iron_mg
      6. calcium_mg
      7. vitamin_d_mcg
      8. vitamin_b12_mcg
      9. folate_mcg
      10. vitamin_a_mcg
      11. vitamin_c_mg
      12. magnesium_mg
      13. zinc_mg
    """
    gender_str = getattr(profile, "gender", "Female") if not isinstance(profile, dict) else profile.get("gender", "Female")
    gender_num = 1 if str(gender_str).lower().strip() in ["male", "1", "m"] else 2
    
    age_val = getattr(profile, "age", 25) if not isinstance(profile, dict) else profile.get("age", 25)
    age_years = float(age_val or 25)

    return {
        "gender": float(gender_num),
        "age_years": age_years,
        "calories_kcal": float(daily_averages.get("calories_kcal", 0.0)),
        "protein_g": float(daily_averages.get("protein_g", 0.0)),
        "iron_mg": float(daily_averages.get("iron_mg", 0.0)),
        "calcium_mg": float(daily_averages.get("calcium_mg", 0.0)),
        "vitamin_d_mcg": float(daily_averages.get("vitamin_d_mcg", 0.0)),
        "vitamin_b12_mcg": float(daily_averages.get("vitamin_b12_mcg", 0.0)),
        "folate_mcg": float(daily_averages.get("folate_mcg", 0.0)),
        "vitamin_a_mcg": float(daily_averages.get("vitamin_a_mcg", 0.0)),
        "vitamin_c_mg": float(daily_averages.get("vitamin_c_mg", 0.0)),
        "magnesium_mg": float(daily_averages.get("magnesium_mg", 0.0)),
        "zinc_mg": float(daily_averages.get("zinc_mg", 0.0)),
    }

def run_model_inference(feature_dict: Dict[str, float]) -> Dict[str, float]:
    """
    Runs multi-output Random Forest inference on the 13-feature input vector:
      1. Order features according to metadata.json
      2. Scale features with preprocess.joblib / scaler.joblib
      3. Call model.predict_proba()
      4. Extract P(class = 1) for all 10 target deficiency labels
    """
    feat_cols = rf_feature_columns or list(feature_dict.keys())
    X_input = pd.DataFrame([feature_dict])[feat_cols]
    X_scaled = rf_scaler.transform(X_input)

    raw_probs = rf_model.predict_proba(X_scaled) if hasattr(rf_model, "predict_proba") else []
    target_labels_map = rf_metadata.get("target_labels_map", {})
    target_cols = rf_metadata.get("target_cols", [])

    risk_probs = {}
    for idx, col_name in enumerate(target_cols):
        def_label = target_labels_map.get(col_name, col_name)
        # Extract P(class=1) -> positive deficiency probability
        if len(raw_probs) > idx and len(raw_probs[idx][0]) > 1:
            prob_positive = float(raw_probs[idx][0][1])
        else:
            prob_positive = 0.1
        risk_probs[def_label] = round(max(0.0, min(1.0, prob_positive)), 3)

    return risk_probs

def apply_lab_boosts(
    risk_probs: Dict[str, float], 
    labs: Any, 
    gender_num: int
) -> Tuple[Dict[str, float], Dict[str, str]]:
    """
    Applies post-prediction laboratory boost rules per specification:
      - Male Hb < 13.0 or Female Hb < 12.0 -> iron >= 0.75
      - Serum Vitamin D < 50.0             -> vitamin_d >= 0.65 (MODERATE band)
      - Ferritin < 30.0                    -> iron >= 0.70
      - Vitamin B12 < 200.0 pg/mL          -> vitamin_b12 >= 0.60
      - Calcium < 8.5 mg/dL                 -> calcium >= 0.55
    """
    boosted_probs = risk_probs.copy()
    lab_updates = {}

    if not labs:
        return boosted_probs, lab_updates

    # Helper getters for dictionary or schema
    def get_lab(name):
        if isinstance(labs, dict):
            val = labs.get(name)
            return float(val) if val is not None and str(val).strip() != "" and float(val) > 0 else None
        val = getattr(labs, name, None)
        return float(val) if val is not None and str(val).strip() != "" and float(val) > 0 else None

    hb = get_lab("hemoglobin_g_dl") or get_lab("hemoglobin")
    serum_iron = get_lab("serum_iron_mcg_dl")
    ferritin = get_lab("ferritin")
    vit_d = get_lab("vit_d_ng_ml") if get_lab("vit_d_ng_ml") is not None else get_lab("serum_vitamin_d")
    vit_b12 = get_lab("vit_b12_pg_ml") if get_lab("vit_b12_pg_ml") is not None else get_lab("vitamin_b12")
    calc = get_lab("calcium_mg_dl") if get_lab("calcium_mg_dl") is not None else get_lab("calcium")

    iron_key = "Iron Deficiency (Anemia)"

    # 1. Hemoglobin Boost: Male < 13 or Female < 12 -> iron >= 0.75
    if hb is not None:
        threshold = 12.0 if gender_num == 2 else 13.0
        if hb < threshold:
            current = boosted_probs.get(iron_key, 0.0)
            boosted_probs[iron_key] = max(current, 0.75)
            lab_updates[iron_key] = f"Hemoglobin of {hb} g/dL is below standard threshold ({'Male < 13' if gender_num == 1 else 'Female < 12'}). Iron risk boosted to {boosted_probs[iron_key]*100:.0f}%."

    # 2. Ferritin Boost: < 30 -> iron >= 0.70
    if ferritin is not None and ferritin < 30.0:
        current = boosted_probs.get(iron_key, 0.0)
        boosted_probs[iron_key] = max(current, 0.70)
        if iron_key not in lab_updates:
            lab_updates[iron_key] = f"Ferritin level of {ferritin} ng/mL is low (< 30). Iron risk boosted to {boosted_probs[iron_key]*100:.0f}%."

    # 3. Serum Iron Fallback Boost
    elif serum_iron is not None and serum_iron < 30.0:
        current = boosted_probs.get(iron_key, 0.0)
        boosted_probs[iron_key] = max(current, 0.70)
        if iron_key not in lab_updates:
            lab_updates[iron_key] = f"Serum iron of {serum_iron} mcg/dL is low (< 30). Iron risk boosted to {boosted_probs[iron_key]*100:.0f}%."

    # 4. Serum Vitamin D Boost: < 50 -> vitamin_d >= 0.65 (MODERATE band)
    vit_d_key = "Vitamin D Deficiency"
    if vit_d is not None and vit_d < 50.0:
        current = boosted_probs.get(vit_d_key, 0.0)
        boosted_probs[vit_d_key] = max(current, 0.65)
        lab_updates[vit_d_key] = f"Serum Vitamin D of {vit_d} is low (< 50). Vitamin D risk boosted to {boosted_probs[vit_d_key]*100:.0f}% (MODERATE band)."

    # 5. Vitamin B12 Boost: < 200 -> vitamin_b12 >= 0.60
    b12_key = "Vitamin B12 Deficiency"
    if vit_b12 is not None and vit_b12 < 200.0:
        current = boosted_probs.get(b12_key, 0.0)
        boosted_probs[b12_key] = max(current, 0.60)
        lab_updates[b12_key] = f"Vitamin B12 level of {vit_b12} pg/mL is low (< 200). Vitamin B12 risk boosted to {boosted_probs[b12_key]*100:.0f}%."

    # 6. Calcium Boost: < 8.5 -> calcium >= 0.55
    calc_key = "Calcium Deficiency"
    if calc is not None and calc < 8.5:
        current = boosted_probs.get(calc_key, 0.0)
        boosted_probs[calc_key] = max(current, 0.55)
        lab_updates[calc_key] = f"Serum Calcium of {calc} mg/dL is low (< 8.5). Calcium risk boosted to {boosted_probs[calc_key]*100:.0f}%."

    return boosted_probs, lab_updates

def execute_assessment_pipeline(
    profile: Any,
    logged_foods: List[Any],
    symptoms: Any = None,
    labs: Any = None,
    user_id: Optional[int] = None,
    enforce_min_days: bool = True
) -> Dict[str, Any]:
    """
    Complete end-to-end Assessment Pipeline execution:
      1. Validates profile and >= 3 distinct diary days.
      2. get_diary_summary() computes daily nutrient averages.
      3. build_feature_dict() merges age, gender and 11 nutrient averages into 13 features.
      4. run_model_inference() scales with preprocess.joblib and runs predict_proba().
      5. apply_lab_boosts() applies clinical post-prediction rules with max().
      6. calculate_wellness_score() computes (1 - avg_risk) * 100.
      7. save_assessment() persists features_json, risks_json, overall_score.
      8. Formats response with detected_deficiencies, recommendations, shap_explanations.
    """
    # ── Step 1: Health Profile Validation ──
    if not profile:
        raise ValueError("A completed health profile is required before running an assessment.")
    
    age = getattr(profile, "age", None) if not isinstance(profile, dict) else profile.get("age")
    gender = getattr(profile, "gender", None) if not isinstance(profile, dict) else profile.get("gender")
    if age is None or gender is None:
        raise ValueError("Health profile must include valid age and gender.")

    # ── Step 2: Diary Summary & 3-Distinct-Day Validation ──
    diary_summary = get_diary_summary(logged_foods)
    distinct_days = diary_summary["distinct_days"]
    
    if enforce_min_days and distinct_days < 3:
        raise ValueError(
            f"You need at least 3 days of food diary data before running an assessment. Currently logged: {distinct_days} distinct day(s)."
        )

    # ── Step 3: Build exactly 13 Model Features ──
    feature_dict = build_feature_dict(profile, diary_summary["daily_averages"])
    logger.info(f"13-Feature Vector for inference: {feature_dict}")

    # ── Step 4: Random Forest MultiOutput predict_proba ──
    raw_risk_probs = run_model_inference(feature_dict)

    # ── Step 4b: Clinical RDA Intake Calibration ──
    # If user dietary intake meets/exceeds RDA, lower predicted deficiency risk
    rda_map = {
        "Vitamin D Deficiency": ("vitamin_d_mcg", 15.0), # 15 mcg = 600 IU
        "Iron Deficiency (Anemia)": ("iron_mg", 18.0 if int(feature_dict["gender"]) == 2 else 8.0),
        "Vitamin B12 Deficiency": ("vitamin_b12_mcg", 2.4),
        "Calcium Deficiency": ("calcium_mg", 1000.0),
        "Folate (Vitamin B9) Deficiency": ("folate_mcg", 400.0),
        "Zinc Deficiency": ("zinc_mg", 11.0 if int(feature_dict["gender"]) == 1 else 8.0),
        "Vitamin A Deficiency": ("vitamin_a_mcg", 900.0 if int(feature_dict["gender"]) == 1 else 700.0),
        "Vitamin C Deficiency": ("vitamin_c_mg", 90.0 if int(feature_dict["gender"]) == 1 else 75.0),
        "Magnesium Deficiency": ("magnesium_mg", 400.0 if int(feature_dict["gender"]) == 1 else 310.0),
        "Protein Deficiency": ("protein_g", 56.0 if int(feature_dict["gender"]) == 1 else 46.0),
    }

    calibrated_probs = raw_risk_probs.copy()
    for def_label, (feat_name, target_rda) in rda_map.items():
        actual_intake = feature_dict.get(feat_name, 0.0)
        ratio = actual_intake / target_rda if target_rda > 0 else 0.0
        if ratio >= 1.0:
            # 100%+ RDA met -> Deficiency risk is low (0.05 - 0.18)
            calibrated_probs[def_label] = round(min(calibrated_probs.get(def_label, 0.5), 0.15), 3)
        elif ratio >= 0.70:
            # 70-99% RDA met -> Moderate/Low risk (0.25 - 0.40)
            calibrated_probs[def_label] = round(min(calibrated_probs.get(def_label, 0.5), 0.38), 3)
        elif ratio < 0.40:
            # Low intake (< 40% RDA met) -> Moderate/High risk (0.45 - 0.65)
            current_p = calibrated_probs.get(def_label, 0.5)
            calibrated_probs[def_label] = round(max(current_p, 0.48), 3)
        elif ratio < 0.70:
            # Sub-optimal intake (40-69% RDA met) -> Moderate risk (0.35 - 0.45)
            current_p = calibrated_probs.get(def_label, 0.4)
            calibrated_probs[def_label] = round(max(current_p, 0.38), 3)

    # ── Step 5: Post-Model Lab Boost ──
    gender_num = int(feature_dict["gender"])
    final_risk_probs, lab_boost_notes = apply_lab_boosts(calibrated_probs, labs, gender_num)

    # ── Helper for PDF top factors ──
    top_factor_map = {
        "Calcium Deficiency": "Low calcium intake",
        "Vitamin B12 Deficiency": "Low B12 intake",
        "Vitamin A Deficiency": "Low vitamin A intake",
        "Vitamin D Deficiency": "Low vitamin D intake, Very low energy intake",
        "Iron Deficiency (Anemia)": "Intake pattern from diary average",
        "Zinc Deficiency": "Intake pattern from diary average",
        "Protein Deficiency": "Intake pattern from diary average",
        "Magnesium Deficiency": "Intake pattern from diary average",
        "Folate (Vitamin B9) Deficiency": "Intake pattern from diary average",
        "Vitamin C Deficiency": "Intake pattern from diary average"
    }

    # ── Step 6: Format Detected Deficiencies & Counts ──
    detected_deficiencies = []
    counts = {"HIGH": 0, "MODERATE": 0, "LOW": 0}

    for def_name, prob in final_risk_probs.items():
        risk_level = get_risk_level(prob)
        is_boosted = def_name in lab_boost_notes
        
        counts[risk_level.upper()] += 1

        top_factor = top_factor_map.get(def_name, "Intake pattern from diary average")
        if is_boosted:
            top_factor = f"Clinical lab boost applied ({lab_boost_notes[def_name]})"

        detected_deficiencies.append({
            "deficiency": def_name,
            "probability": round(prob, 3),
            "risk_level": risk_level,
            "confidence": f"{int(prob * 100)}%",
            "lab_boosted": is_boosted,
            "lab_note": lab_boost_notes.get(def_name, ""),
            "top_factor": top_factor
        })

    # Sort descending by risk probability
    detected_deficiencies.sort(key=lambda x: x["probability"], reverse=True)

    # ── Step 7: Wellness Score Calculation ──
    prob_list = [d["probability"] for d in detected_deficiencies]
    overall_wellness_score = float(calculate_wellness_score(prob_list))

    # ── Step 8: SHAP Explainability & Recommendations ──
    explanation_input = feature_dict.copy()
    if symptoms:
        for skey in ["fatigue", "hair_loss", "pale_skin", "muscle_weakness", "mood_changes", "brittle_nails", "bleeding_gums", "dry_skin", "cold_intolerance", "slow_healing"]:
            val = False
            if isinstance(symptoms, dict):
                s_val = symptoms.get(skey)
            else:
                s_val = getattr(symptoms, skey, None)
            
            if s_val is not None:
                if isinstance(s_val, dict):
                    val = s_val.get("present", False)
                elif hasattr(s_val, "present"):
                    val = getattr(s_val, "present", False)
                else:
                    val = bool(s_val)
            explanation_input[skey] = 1 if val else 0

    shap_explanations = compute_shap_explanations(explanation_input, final_risk_probs)
    
    diet_restrictions = getattr(profile, "dietary_restrictions", []) if not isinstance(profile, dict) else profile.get("dietary_restrictions", [])
    if user_id:
        try:
            hp = get_health_profile(user_id)
            if hp and hp.get("diet_restrictions"):
                db_restrs = hp["diet_restrictions"]
                if isinstance(db_restrs, list):
                    diet_restrictions = list(set((diet_restrictions or []) + db_restrs))
        except Exception as e:
            logger.warning(f"Could not load health profile diet restrictions for user {user_id}: {e}")

    recommendations = get_dietary_recommendations(detected_deficiencies, diet_restrictions)

    # Nutritional Intake Summary for UI charts
    enriched_items = []
    for d, nuts in diary_summary["enriched_by_date"].items():
        enriched_items.append(nuts)
    nutr_analysis = calculate_daily_nutrition(enriched_items, {"gender": gender, "age": age})

    # Combine Bayesian lab notes
    lab_dict = labs.model_dump() if hasattr(labs, "model_dump") else (labs if isinstance(labs, dict) else {})
    _, bayesian_updates = apply_bayesian_lab_updates(final_risk_probs, lab_dict, gender=gender_num)
    for k, v in lab_boost_notes.items():
        bayesian_updates[k] = v

    # ── Step 9: Database Persistence ──
    features_json_str = json.dumps(feature_dict, indent=2)
    risks_json_str = json.dumps(detected_deficiencies, indent=2)
    
    saved_id = None
    if user_id is not None:
        try:
            saved_id = save_assessment(
                user_id=user_id,
                diary_days_used=distinct_days,
                features_json=features_json_str,
                risks_json=risks_json_str,
                overall_score=overall_wellness_score
            )
            logger.info(f"Successfully saved assessment ID {saved_id} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to persist assessment for user {user_id}: {e}")

    return {
        "assessment_id": saved_id,
        "overall_health_score": int(round(overall_wellness_score)),
        "detected_deficiencies": detected_deficiencies,
        "counts": counts,
        "bayesian_lab_updates": bayesian_updates,
        "shap_explanations": shap_explanations,
        "nutritional_intake_summary": nutr_analysis,
        "recommendations": recommendations,
        "feature_vector": feature_dict,
        "daily_averages": diary_summary["daily_averages"],
        "distinct_diary_days": distinct_days
    }
