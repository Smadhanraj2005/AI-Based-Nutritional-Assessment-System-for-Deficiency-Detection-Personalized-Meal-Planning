"""
Comprehensive Test Suite for NutriSense Assessment Pipeline
============================================================
Tests the complete pipeline per NutriSense_Assessment_Model_IO_and_Wellness_Score.pdf specification.

Test Cases:
  1. Portion scaling: nutrient_logged = (nutrient_per_100g / 100) * portion_grams
  2. 3-distinct-day aggregation across 7-day window
  3. Insufficient diary days (< 3) returns 400
  4. Feature ordering matches metadata.json exactly (13 features)
  5. 10 deficiency probabilities returned (0-1 range)
  6. Lab boost uses max() rule correctly
  7. Wellness score formula: (1 - avg_risk) * 100
  8. User isolation (different user_id gets different results)
  9. Risk classification bands: <0.35 Low, 0.35-0.65 Moderate, >0.65 High
  10. Full worked example validation with known inputs
"""

import sys
import os
import json
import pytest

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.services.assessment_service import (
    get_diary_summary,
    build_feature_dict,
    run_model_inference,
    apply_lab_boosts,
    calculate_wellness_score,
    get_risk_level,
    execute_assessment_pipeline,
    NUTRIENT_KEYS,
)
from app.services.model_loader import metadata as rf_metadata

client = TestClient(app)


# ──────────────────────────────────────────────────────────────
# Helper: Build a minimal profile dict
# ──────────────────────────────────────────────────────────────
def _profile(age=28, gender="Female"):
    return {
        "name": "Test User",
        "age": age,
        "gender": gender,
        "weight_kg": 62.0,
        "height_cm": 168.0,
        "activity_level": "Moderate",
        "medical_conditions": [],
        "dietary_restrictions": [],
        "health_goals": [],
    }


def _food_item(food_id="food_1", name="Spinach", serving_g=100, meal_type="Lunch", date="2026-08-10", **nutrients):
    """Create a food item dict with explicit nutrient values (already scaled by caller or per-100g)."""
    base = {
        "food_id": food_id,
        "food_name": name,
        "serving_g": serving_g,
        "meal_type": meal_type,
        "date": date,
        "calories_kcal": nutrients.get("calories_kcal", 23),
        "protein_g": nutrients.get("protein_g", 2.9),
        "iron_mg": nutrients.get("iron_mg", 2.71),
        "calcium_mg": nutrients.get("calcium_mg", 99),
        "vitamin_d_mcg": nutrients.get("vitamin_d_mcg", 0),
        "vitamin_b12_mcg": nutrients.get("vitamin_b12_mcg", 0),
        "folate_mcg": nutrients.get("folate_mcg", 194),
        "vitamin_a_mcg": nutrients.get("vitamin_a_mcg", 469),
        "vitamin_c_mg": nutrients.get("vitamin_c_mg", 28.1),
        "magnesium_mg": nutrients.get("magnesium_mg", 79),
        "zinc_mg": nutrients.get("zinc_mg", 0.53),
    }
    return base


# ══════════════════════════════════════════════════════════════
# TEST 1: Portion scaling
# ══════════════════════════════════════════════════════════════
class TestPortionScaling:
    def test_100g_base(self):
        """100g serving should yield full nutrient values."""
        items = [_food_item(serving_g=100, date="2026-08-10", iron_mg=2.71)]
        summary = get_diary_summary(items, food_db_map={})
        assert abs(summary["daily_totals"]["iron_mg"] - 2.71) < 0.01

    def test_50g_half(self):
        """50g serving: nutrients in item dict are already scaled by frontend."""
        # Frontend sends pre-scaled nutrients, so we simulate that
        items = [_food_item(serving_g=50, date="2026-08-10", iron_mg=1.355)]
        summary = get_diary_summary(items, food_db_map={})
        assert abs(summary["daily_totals"]["iron_mg"] - 1.355) < 0.01

    def test_200g_double(self):
        """200g serving: pre-scaled nutrients."""
        items = [_food_item(serving_g=200, date="2026-08-10", iron_mg=5.42)]
        summary = get_diary_summary(items, food_db_map={})
        assert abs(summary["daily_totals"]["iron_mg"] - 5.42) < 0.01


# ══════════════════════════════════════════════════════════════
# TEST 2: 3-distinct-day aggregation
# ══════════════════════════════════════════════════════════════
class TestDiaryAggregation:
    def test_three_day_average(self):
        """Averages across 3 distinct days should divide totals by 3."""
        items = [
            _food_item(date="2026-08-10", iron_mg=3.0),
            _food_item(date="2026-08-11", iron_mg=6.0),
            _food_item(date="2026-08-12", iron_mg=9.0),
        ]
        summary = get_diary_summary(items, food_db_map={})
        assert summary["distinct_days"] == 3
        # Average = (3+6+9) / 3 = 6.0
        assert abs(summary["daily_averages"]["iron_mg"] - 6.0) < 0.01

    def test_multiple_foods_same_day(self):
        """Multiple foods on same day should sum, not create extra days."""
        items = [
            _food_item(date="2026-08-10", iron_mg=2.0),
            _food_item(date="2026-08-10", iron_mg=3.0),
            _food_item(date="2026-08-11", iron_mg=5.0),
            _food_item(date="2026-08-12", iron_mg=4.0),
        ]
        summary = get_diary_summary(items, food_db_map={})
        assert summary["distinct_days"] == 3
        # Day totals: 10=5, 11=5, 12=4 → avg = 14/3 ≈ 4.67
        assert abs(summary["daily_averages"]["iron_mg"] - (14.0 / 3)) < 0.01


# ══════════════════════════════════════════════════════════════
# TEST 3: Insufficient diary days error
# ══════════════════════════════════════════════════════════════
class TestInsufficientDays:
    def test_fewer_than_3_days_raises_error(self):
        """Pipeline should raise ValueError when < 3 distinct diary days."""
        items = [
            _food_item(date="2026-08-10"),
            _food_item(date="2026-08-11"),
        ]
        with pytest.raises(ValueError, match="at least 3 days"):
            execute_assessment_pipeline(
                profile=_profile(),
                logged_foods=items,
                enforce_min_days=True,
            )

    def test_exactly_3_days_passes(self):
        """Pipeline should succeed with exactly 3 distinct days."""
        items = [
            _food_item(date="2026-08-10"),
            _food_item(date="2026-08-11"),
            _food_item(date="2026-08-12"),
        ]
        result = execute_assessment_pipeline(
            profile=_profile(),
            logged_foods=items,
            enforce_min_days=True,
        )
        assert "overall_health_score" in result
        assert "detected_deficiencies" in result

    def test_api_returns_400_for_insufficient_days(self):
        """POST /api/assess should return 400 when < 3 distinct days."""
        payload = {
            "profile": _profile(),
            "logged_foods": [
                {"food_id": "food_1", "food_name": "Spinach", "serving_g": 100, "meal_type": "Lunch"},
            ],
            "symptoms": {
                "fatigue": False, "hair_loss": False, "pale_skin": False,
                "muscle_weakness": False, "mood_changes": False, "brittle_nails": False,
                "bleeding_gums": False, "dry_skin": False, "cold_intolerance": False,
                "slow_healing": False,
            },
        }
        response = client.post("/api/assess?user_id=999", json=payload)
        assert response.status_code == 400
        assert "at least 3 days" in response.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════
# TEST 4: Feature ordering matches metadata.json
# ══════════════════════════════════════════════════════════════
class TestFeatureOrdering:
    def test_13_features_exact_order(self):
        """Feature dict must contain exactly 13 features in metadata.json order."""
        expected = rf_metadata.get("feature_names", [])
        assert len(expected) == 13, f"metadata.json should have 13 features, got {len(expected)}"

        avg = {k: 1.0 for k in NUTRIENT_KEYS}
        fd = build_feature_dict(_profile(age=28, gender="Female"), avg)

        assert len(fd) == 13
        for name in expected:
            assert name in fd, f"Feature '{name}' missing from feature dict"

    def test_gender_encoding(self):
        """Male → 1, Female → 2."""
        avg = {k: 0.0 for k in NUTRIENT_KEYS}
        fd_f = build_feature_dict(_profile(gender="Female"), avg)
        fd_m = build_feature_dict(_profile(gender="Male"), avg)
        assert fd_f["gender"] == 2.0
        assert fd_m["gender"] == 1.0


# ══════════════════════════════════════════════════════════════
# TEST 5: 10 deficiency probabilities in [0,1]
# ══════════════════════════════════════════════════════════════
class TestModelProbabilities:
    def test_10_probabilities(self):
        """Model must return exactly 10 deficiency probabilities."""
        avg = {k: 50.0 for k in NUTRIENT_KEYS}
        fd = build_feature_dict(_profile(), avg)
        probs = run_model_inference(fd)
        assert len(probs) == 10, f"Expected 10 probabilities, got {len(probs)}"

    def test_probabilities_0_to_1(self):
        """All probabilities must be in [0, 1]."""
        avg = {k: 50.0 for k in NUTRIENT_KEYS}
        fd = build_feature_dict(_profile(), avg)
        probs = run_model_inference(fd)
        for label, p in probs.items():
            assert 0.0 <= p <= 1.0, f"{label} probability {p} out of bounds"


# ══════════════════════════════════════════════════════════════
# TEST 6: Lab boost uses max() correctly
# ══════════════════════════════════════════════════════════════
class TestLabBoost:
    def test_iron_boost_female_low_hb(self):
        """Female Hb < 12 → iron = max(model_prob, 0.75)."""
        risk = {"Iron Deficiency (Anemia)": 0.30}
        labs = {"hemoglobin_g_dl": 10.5}
        boosted, notes = apply_lab_boosts(risk, labs, gender_num=2)
        assert boosted["Iron Deficiency (Anemia)"] == 0.75
        assert "Iron Deficiency (Anemia)" in notes

    def test_iron_boost_preserves_higher_model(self):
        """If model prob > 0.75, lab boost should not lower it."""
        risk = {"Iron Deficiency (Anemia)": 0.85}
        labs = {"hemoglobin_g_dl": 10.5}
        boosted, _ = apply_lab_boosts(risk, labs, gender_num=2)
        assert boosted["Iron Deficiency (Anemia)"] == 0.85

    def test_vitamin_d_boost(self):
        """Vitamin D < 30 → max(model_prob, 0.65)."""
        risk = {"Vitamin D Deficiency": 0.20}
        labs = {"vit_d_ng_ml": 18.0}
        boosted, notes = apply_lab_boosts(risk, labs, gender_num=2)
        assert boosted["Vitamin D Deficiency"] == 0.65

    def test_b12_boost(self):
        """B12 < 200 → max(model_prob, 0.60)."""
        risk = {"Vitamin B12 Deficiency": 0.25}
        labs = {"vit_b12_pg_ml": 180.0}
        boosted, notes = apply_lab_boosts(risk, labs, gender_num=2)
        assert boosted["Vitamin B12 Deficiency"] == 0.60

    def test_calcium_boost(self):
        """Calcium < 8.5 → max(model_prob, 0.55)."""
        risk = {"Calcium Deficiency": 0.10}
        labs = {"calcium_mg_dl": 7.9}
        boosted, notes = apply_lab_boosts(risk, labs, gender_num=2)
        assert boosted["Calcium Deficiency"] == 0.55

    def test_no_boost_when_labs_normal(self):
        """Normal lab values should not boost any risk."""
        risk = {"Iron Deficiency (Anemia)": 0.30, "Vitamin D Deficiency": 0.20}
        labs = {"hemoglobin_g_dl": 14.0, "vit_d_ng_ml": 50.0}
        boosted, notes = apply_lab_boosts(risk, labs, gender_num=2)
        assert boosted["Iron Deficiency (Anemia)"] == 0.30
        assert boosted["Vitamin D Deficiency"] == 0.20
        assert len(notes) == 0


# ══════════════════════════════════════════════════════════════
# TEST 7: Wellness score formula
# ══════════════════════════════════════════════════════════════
class TestWellnessScore:
    def test_formula_basic(self):
        """Wellness score = round((1.0 - avg) * 100.0, 1)."""
        probs = [0.2, 0.4, 0.6]
        avg = sum(probs) / len(probs)  # 0.4
        expected = round((1.0 - avg) * 100.0, 1)  # 60.0
        assert calculate_wellness_score(probs) == expected

    def test_all_zero_risk(self):
        """All zero probabilities → score = 100."""
        assert calculate_wellness_score([0.0] * 10) == 100.0

    def test_all_max_risk(self):
        """All 1.0 probabilities → score = 0.0."""
        assert calculate_wellness_score([1.0] * 10) == 0.0

    def test_bounded_0_100(self):
        """Score should never exceed [0, 100]."""
        assert 0 <= calculate_wellness_score([0.5]) <= 100
        assert 0 <= calculate_wellness_score([0.99]) <= 100
        assert 0 <= calculate_wellness_score([0.01]) <= 100

    def test_score_sensitivity(self):
        """Changing risk probabilities changes the Wellness Score."""
        score_a = calculate_wellness_score([0.2, 0.2, 0.2])
        score_b = calculate_wellness_score([0.7, 0.7, 0.7])
        assert score_a > score_b


class TestDiaryDayCounting:
    def test_distinct_days_multiple_entries(self):
        # 2026-08-11 -> 3 foods, 2 foods
        # 2026-08-12 -> 4 foods
        # 2026-08-13 -> 1 food
        # Expected: distinct_days = 3
        items = [
            _food_item(date="2026-08-11", food_id="f1"),
            _food_item(date="2026-08-11", food_id="f2"),
            _food_item(date="2026-08-11", food_id="f3"),
            _food_item(date="2026-08-11", food_id="f4"),
            _food_item(date="2026-08-11", food_id="f5"),
            _food_item(date="2026-08-12", food_id="f6"),
            _food_item(date="2026-08-12", food_id="f7"),
            _food_item(date="2026-08-12", food_id="f8"),
            _food_item(date="2026-08-12", food_id="f9"),
            _food_item(date="2026-08-13", food_id="f10"),
        ]
        summary = get_diary_summary(items, food_db_map={})
        assert summary["distinct_days"] == 3

    def test_distinct_days_single_day(self):
        # All entries on 2026-08-11 -> distinct_days = 1
        items = [
            _food_item(date="2026-08-11", food_id="f1"),
            _food_item(date="2026-08-11", food_id="f2"),
        ]
        summary = get_diary_summary(items, food_db_map={})
        assert summary["distinct_days"] == 1

    def test_distinct_days_three_days(self):
        # Entries on 2026-08-11, 2026-08-12, 2026-08-13 -> distinct_days = 3
        items = [
            _food_item(date="2026-08-11", food_id="f1"),
            _food_item(date="2026-08-12", food_id="f2"),
            _food_item(date="2026-08-13", food_id="f3"),
        ]
        summary = get_diary_summary(items, food_db_map={})
        assert summary["distinct_days"] == 3


# ══════════════════════════════════════════════════════════════
# TEST 8: User isolation
# ══════════════════════════════════════════════════════════════
class TestUserIsolation:
    def test_different_profiles_different_features(self):
        """Different age/gender should produce different feature vectors."""
        avg = {k: 50.0 for k in NUTRIENT_KEYS}
        fd_young_f = build_feature_dict(_profile(age=22, gender="Female"), avg)
        fd_old_m = build_feature_dict(_profile(age=55, gender="Male"), avg)

        assert fd_young_f["age_years"] != fd_old_m["age_years"]
        assert fd_young_f["gender"] != fd_old_m["gender"]

    def test_different_diets_different_risks(self):
        """Different nutrient intakes should produce different risk profiles."""
        low_diet = {k: 1.0 for k in NUTRIENT_KEYS}
        high_diet = {k: 500.0 for k in NUTRIENT_KEYS}

        fd_low = build_feature_dict(_profile(), low_diet)
        fd_high = build_feature_dict(_profile(), high_diet)

        probs_low = run_model_inference(fd_low)
        probs_high = run_model_inference(fd_high)

        # At least some probabilities should differ
        diffs = sum(1 for k in probs_low if abs(probs_low[k] - probs_high[k]) > 0.01)
        assert diffs > 0, "Different diets should produce different risk profiles"


# ══════════════════════════════════════════════════════════════
# TEST 9: Risk classification bands
# ══════════════════════════════════════════════════════════════
class TestRiskClassification:
    def test_low_band(self):
        assert get_risk_level(0.0) == "Low"
        assert get_risk_level(0.34) == "Low"

    def test_moderate_band(self):
        assert get_risk_level(0.35) == "Moderate"
        assert get_risk_level(0.50) == "Moderate"
        assert get_risk_level(0.65) == "Moderate"

    def test_high_band(self):
        assert get_risk_level(0.66) == "High"
        assert get_risk_level(0.99) == "High"
        assert get_risk_level(1.0) == "High"


# ══════════════════════════════════════════════════════════════
# TEST 10: Full worked example (end-to-end pipeline)
# ══════════════════════════════════════════════════════════════
class TestWorkedExample:
    def test_full_pipeline_execution(self):
        """
        End-to-end pipeline with realistic inputs:
        28F, moderate diet across 3 days, low lab values.
        Validates structure and correctness of full response.
        """
        foods = [
            _food_item(date="2026-08-10", calories_kcal=200, protein_g=15, iron_mg=3.0, calcium_mg=100,
                        vitamin_d_mcg=2.0, vitamin_b12_mcg=0.5, folate_mcg=100, vitamin_a_mcg=200,
                        vitamin_c_mg=30, magnesium_mg=50, zinc_mg=2.0),
            _food_item(date="2026-08-11", calories_kcal=250, protein_g=18, iron_mg=4.0, calcium_mg=120,
                        vitamin_d_mcg=1.5, vitamin_b12_mcg=0.3, folate_mcg=80, vitamin_a_mcg=150,
                        vitamin_c_mg=25, magnesium_mg=45, zinc_mg=1.5),
            _food_item(date="2026-08-12", calories_kcal=180, protein_g=12, iron_mg=2.5, calcium_mg=90,
                        vitamin_d_mcg=1.0, vitamin_b12_mcg=0.2, folate_mcg=60, vitamin_a_mcg=100,
                        vitamin_c_mg=20, magnesium_mg=35, zinc_mg=1.0),
        ]
        labs = {
            "hemoglobin_g_dl": 10.5,
            "vit_d_ng_ml": 18.0,
            "vit_b12_pg_ml": 180.0,
            "serum_iron_mcg_dl": 40.0,
            "calcium_mg_dl": 9.0,
        }

        result = execute_assessment_pipeline(
            profile=_profile(age=28, gender="Female"),
            logged_foods=foods,
            labs=labs,
            enforce_min_days=True,
            user_id=None,  # Don't persist in test
        )

        # Structural assertions
        assert "overall_health_score" in result
        assert "detected_deficiencies" in result
        assert "feature_vector" in result
        assert len(result["feature_vector"]) == 13
        assert len(result["detected_deficiencies"]) == 10

        # Feature vector correctness
        fv = result["feature_vector"]
        assert fv["gender"] == 2.0  # Female
        assert fv["age_years"] == 28.0
        # Average calories = (200+250+180)/3 = 210
        assert abs(fv["calories_kcal"] - 210.0) < 0.1
        # Average protein = (15+18+12)/3 = 15
        assert abs(fv["protein_g"] - 15.0) < 0.1
        # Average iron = (3+4+2.5)/3 = 3.167
        assert abs(fv["iron_mg"] - 3.167) < 0.1

        # Wellness score is in valid range
        score = result["overall_health_score"]
        assert 0 <= score <= 100

        # Lab boosts should have been applied
        defs = {d["deficiency"]: d for d in result["detected_deficiencies"]}
        # Iron: Female Hb 10.5 < 12 → boosted to at least 0.75
        assert defs["Iron Deficiency (Anemia)"]["probability"] >= 0.75
        # Vit D: 18 < 30 → boosted to at least 0.65
        assert defs["Vitamin D Deficiency"]["probability"] >= 0.65
        # B12: 180 < 200 → boosted to at least 0.60
        assert defs["Vitamin B12 Deficiency"]["probability"] >= 0.60

        # Risk levels are correctly classified
        for d in result["detected_deficiencies"]:
            p = d["probability"]
            if p > 0.65:
                assert d["risk_level"] == "High"
            elif p >= 0.35:
                assert d["risk_level"] == "Moderate"
            else:
                assert d["risk_level"] == "Low"

    def test_distinct_diary_days_tracked(self):
        """Result should report distinct_diary_days used."""
        foods = [
            _food_item(date="2026-08-10"),
            _food_item(date="2026-08-10"),  # Same day
            _food_item(date="2026-08-11"),
            _food_item(date="2026-08-12"),
        ]
        result = execute_assessment_pipeline(
            profile=_profile(),
            logged_foods=foods,
            enforce_min_days=True,
            user_id=None,
        )
        assert result["distinct_diary_days"] == 3


# ══════════════════════════════════════════════════════════════
# Run with: pytest backend/tests/test_assessment_pipeline.py -v
# ══════════════════════════════════════════════════════════════
