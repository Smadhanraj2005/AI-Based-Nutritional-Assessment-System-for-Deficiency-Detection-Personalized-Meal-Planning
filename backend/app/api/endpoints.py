import os
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.services.model_loader import model as rf_model, scaler as rf_scaler, metadata as rf_metadata, feature_columns as rf_feature_columns
from app.services.nutrition_calculator import calculate_daily_nutrition
from app.services.recommendation_service import get_dietary_recommendations
from app.services.meal_planner import generate_7day_meal_plan
from app.ml.bayesian_updater import apply_bayesian_lab_updates
from app.ml.shap_explainer import compute_shap_explanations
from app.models.schemas import (
    UserProfileSchema, DailyFoodDiarySchema, SymptomQuestionnaireSchema,
    LabTestReportSchema, AssessmentRequestSchema, AssessmentResponseSchema,
    UserRegisterSchema, UserLoginSchema, AuthResponseSchema
)
from app.db.database import search_food_items, get_food_by_id
router = APIRouter()

# Path for persistent user storage
USER_DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "users.json")

def _load_users():
    if not os.path.exists(USER_DATA_PATH):
        # Initialize empty list
        os.makedirs(os.path.dirname(USER_DATA_PATH), exist_ok=True)
        with open(USER_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump([], f)
    with open(USER_DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_users(users):
    with open(USER_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)

# In-memory demo user (not persisted)
DEMO_USER = {
    "email": "alex@nutriai.com",
    "name": "Alex Morgan",
    "password": "password123",
    "age": 28,
    "gender": "Female",
    "weight_kg": 62.0,
    "height_cm": 168.0,
    "dietary_restrictions": ["Gluten-Free"],
    "token": "demo_token_alex_123"
}

@router.post("/auth/register", response_model=AuthResponseSchema)
def register_user(payload: UserRegisterSchema):
    email_clean = payload.email.lower().strip()
    users = _load_users()
    if any(u["email"].lower() == email_clean for u in users):
        raise HTTPException(status_code=400, detail="Account with this email already exists.")
    
    token = f"token_{hash(email_clean)}_{payload.name[:3]}"
    user_record = {
        "name": payload.name,
        "email": email_clean,
        "password": payload.password,
        "age": payload.age or 28,
        "gender": payload.gender or "Female",
        "weight_kg": 65.0,
        "height_kg": 170.0,
        "dietary_restrictions": payload.dietary_restrictions or [],
        "token": token
    }
    users.append(user_record)
    _save_users(users)
    
    user_res = {k: v for k, v in user_record.items() if k != "password"}
    return {"token": token, "user": user_res}

@router.post("/auth/login", response_model=AuthResponseSchema)
def login_user(payload: UserLoginSchema):
    email_clean = payload.email.lower().strip()
    # Check demo user first
    if email_clean == DEMO_USER["email"] and payload.password == DEMO_USER["password"]:
        return {"token": DEMO_USER["token"], "user": {k: v for k, v in DEMO_USER.items() if k != "password"}}
    
    users = _load_users()
    user = next((u for u in users if u["email"].lower() == email_clean), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    return {"token": user["token"], "user": {k: v for k, v in user.items() if k != "password"}}

@router.get("/auth/me")
def get_current_user(token: Optional[str] = Query(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    # Check demo token
    if token == DEMO_USER["token"]:
        return {k: v for k, v in DEMO_USER.items() if k != "password"}
    
    users = _load_users()
    for user in users:
        if user.get("token") == token:
            return {k: v for k, v in user.items() if k != "password"}
    raise HTTPException(status_code=401, detail="Invalid session token.")


# Load food database & recipes
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
ML_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml")

def get_food_db():
    try:
        db_foods = search_food_items(query=None, limit=500)
        if db_foods:
            return db_foods
    except Exception:
        pass
    with open(os.path.join(DATA_DIR, "food_database.json"), "r") as f:
        return json.load(f)

def get_recipes_db():
    with open(os.path.join(DATA_DIR, "recipes.json"), "r") as f:
        return json.load(f)

# Load trained ML Model
MODEL_PATH = os.path.join(ML_DIR, "models", "deficiency_model.joblib")
SCALER_PATH = os.path.join(ML_DIR, "models", "scaler.joblib")
META_PATH = os.path.join(ML_DIR, "models", "metadata.json")

def load_ml_pipeline():
    if not os.path.exists(MODEL_PATH):
        # Auto-train if model file doesn't exist yet
        from app.ml.model_trainer import train_and_save_model
        train_and_save_model()
        
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(META_PATH, "r") as f:
        meta = json.load(f)
    return model, scaler, meta

@router.get("/foods/search")
def search_foods(q: Optional[str] = Query(None)):
    try:
        return search_food_items(query=q, limit=100)
    except Exception:
        foods = get_food_db()
        if not q:
            return foods
        query = q.lower()
        return [f for f in foods if query in f["name"].lower() or query in f.get("category", "").lower()]

@router.post("/assessment/predict", response_model=AssessmentResponseSchema)
def predict_deficiency_assessment(request: AssessmentRequestSchema):
    model = rf_model
    scaler = rf_scaler
    meta = rf_metadata
    
    # 1. Match logged foods to full nutrient profiles
    food_db = {f["id"]: f for f in get_food_db()}
    enriched_logged_foods = []
    for item in request.logged_foods:
        f_info = food_db.get(item.food_id, {})
        merged = {**f_info, "serving_g": item.serving_g}
        enriched_logged_foods.append(merged)
        
    # 2. Compute Nutritional Intake vs RDA
    nutr_analysis = calculate_daily_nutrition(
        enriched_logged_foods, 
        {"gender": request.profile.gender, "age": request.profile.age}
    )
    pcts = nutr_analysis["percentages"]
    
    # 3. Construct Feature Vector for ML Model
    gender_num = 1 if request.profile.gender.lower() == "female" else 0
    bmi = request.profile.weight_kg / ((request.profile.height_cm / 100) ** 2)
    
    labs = request.labs or LabTestReportSchema()
    
    feature_dict = {
        "age": request.profile.age,
        "gender": gender_num,
        "bmi": bmi,
        "iron_intake_pct": pcts.get("iron_mg_pct", 50.0),
        "vit_d_intake_pct": pcts.get("vitamin_d_iu_pct", 40.0),
        "vit_b12_intake_pct": pcts.get("vitamin_b12_mcg_pct", 45.0),
        "calcium_intake_pct": pcts.get("calcium_mg_pct", 55.0),
        "folate_intake_pct": pcts.get("folate_mcg_pct", 50.0),
        "zinc_intake_pct": pcts.get("zinc_mg_pct", 50.0),
        "vit_a_intake_pct": pcts.get("vitamin_a_iu_pct", 55.0),
        "vit_c_intake_pct": pcts.get("vitamin_c_mg_pct", 60.0),
        "mag_intake_pct": pcts.get("magnesium_mg_pct", 50.0),
        "iodine_intake_pct": pcts.get("iodine_mcg_pct", 55.0),
        "fatigue": 1 if request.symptoms.fatigue else 0,
        "hair_loss": 1 if request.symptoms.hair_loss else 0,
        "pale_skin": 1 if request.symptoms.pale_skin else 0,
        "muscle_weakness": 1 if request.symptoms.muscle_weakness else 0,
        "mood_changes": 1 if request.symptoms.mood_changes else 0,
        "brittle_nails": 1 if request.symptoms.brittle_nails else 0,
        "bleeding_gums": 1 if request.symptoms.bleeding_gums else 0,
        "dry_skin": 1 if request.symptoms.dry_skin else 0,
        "cold_intolerance": 1 if request.symptoms.cold_intolerance else 0,
        "slow_healing": 1 if request.symptoms.slow_healing else 0,
        "hemoglobin_g_dl": labs.hemoglobin_g_dl if labs.hemoglobin_g_dl is not None else 13.5,
        "vit_d_ng_ml": labs.vit_d_ng_ml if labs.vit_d_ng_ml is not None else 35.0,
        "vit_b12_pg_ml": labs.vit_b12_pg_ml if labs.vit_b12_pg_ml is not None else 450.0,
        "serum_iron_mcg_dl": labs.serum_iron_mcg_dl if labs.serum_iron_mcg_dl is not None else 90.0,
        "calcium_mg_dl": labs.calcium_mg_dl if labs.calcium_mg_dl is not None else 9.5
    }
    
    feat_cols = rf_feature_columns
    X_input = pd.DataFrame([feature_dict])[feat_cols]
    X_scaled = scaler.transform(X_input)
    
    # 4. Predict Multi-label Deficiency Probabilities
    # Model predict_proba returns list of arrays per target
    raw_probs = model.predict_proba(X_scaled) if hasattr(model, "predict_proba") else []
    # Safely extract metadata mappings with defaults
    target_labels_map = meta.get("target_labels_map", {})
    target_cols = meta.get("target_cols", [])

    prior_probs = {}
    if target_cols:
        for idx, col_name in enumerate(target_cols):
            def_label = target_labels_map.get(col_name, col_name)
            prob_positive = float(raw_probs[idx][0][1]) if len(raw_probs) > idx and len(raw_probs[idx][0]) > 1 else 0.1
            prior_probs[def_label] = prob_positive

    # 5. Apply Bayesian Lab Value Updates
    lab_dict = labs.model_dump() if labs else {}
    posterior_probs, bayesian_updates = apply_bayesian_lab_updates(prior_probs, lab_dict, gender=gender_num)
    
    # Format detected deficiency list
    detected_deficiencies = []
    for def_label, prob in posterior_probs.items():
        if prob >= 0.35: # Threshold for moderate/high risk
            risk_level = "High" if prob >= 0.65 else "Moderate"
            detected_deficiencies.append({
                "deficiency": def_label,
                "probability": round(prob, 2),
                "risk_level": risk_level,
                "confidence": f"{int(prob * 100)}%"
            })

    detected_deficiencies.sort(key=lambda x: x["probability"], reverse=True)
    
    # 6. Generate SHAP Model Explainability
    shap_explanations = compute_shap_explanations(feature_dict, posterior_probs)
    
    # 7. Generate Targeted Dietary Recommendations
    recommendations = get_dietary_recommendations(
        detected_deficiencies, 
        request.profile.dietary_restrictions
    )
    
    # Calculate overall health score (100 - weighted deficiency risk penalty)
    total_penalty = sum([d["probability"] * 25 for d in detected_deficiencies])
    overall_health_score = max(35, int(100 - total_penalty))

    return {
        "overall_health_score": overall_health_score,
        "detected_deficiencies": detected_deficiencies,
        "bayesian_lab_updates": bayesian_updates,
        "shap_explanations": shap_explanations,
        "nutritional_intake_summary": nutr_analysis,
        "recommendations": recommendations
    }

@router.post("/meal-plan/generate")
def get_personalized_meal_plan(request: AssessmentRequestSchema):
    assessment = predict_deficiency_assessment(request)
    deficiencies = assessment["detected_deficiencies"]
    meal_plan = generate_7day_meal_plan(deficiencies, request.profile.dietary_restrictions)
    return {
        "meal_plan": meal_plan,
        "targeted_deficiencies": [d["deficiency"] for d in deficiencies]
    }

@router.get("/recipes")
def list_recipes():
    return get_recipes_db()

@router.get("/longitudinal-progress")
def get_longitudinal_progress():
    """
    Returns simulated/tracked longitudinal progress across 4, 8, and 12 weeks of plan adherence.
    """
    return {
        "weeks": ["Baseline", "Week 4", "Week 8", "Week 12"],
        "overall_risk_index": [78, 52, 31, 14], # 0-100 scale (lower is better)
        "deficiency_trends": [
            {"name": "Iron Deficiency Anemia", "data": [72, 45, 22, 8]},
            {"name": "Vitamin D Deficiency", "data": [85, 60, 35, 12]},
            {"name": "Vitamin B12 Deficiency", "data": [65, 40, 18, 5]}
        ],
        "compliance_rate_pct": [65, 82, 91, 95]
    }

@router.get("/model/metadata")
def get_model_metadata():
    """Return model metadata such as feature names and target label mapping."""
    return rf_metadata
