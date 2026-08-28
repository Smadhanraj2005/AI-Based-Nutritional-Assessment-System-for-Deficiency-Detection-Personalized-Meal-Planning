import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_food_search_endpoint():
    response = client.get("/api/foods/search?q=Spinach")
    assert response.status_code == 200
    foods = response.json()
    assert len(foods) > 0
    assert "Spinach" in foods[0]["name"]

def test_deficiency_prediction_13_feature_model():
    """Test the new 13-feature NHANES assessment pipeline."""
    payload = {
        "profile": {
            "name": "Test Subject",
            "age": 30,
            "gender": "Female",
            "weight_kg": 60.0,
            "height_cm": 165.0,
            "activity_level": "Moderate",
            "medical_conditions": [],
            "dietary_restrictions": ["Gluten-Free"],
            "health_goals": ["Address Fatigue"]
        },
        "logged_foods": [
            { "food_id": "food_1", "food_name": "Spinach", "serving_g": 50, "meal_type": "Breakfast" }
        ],
        "symptoms": {
            "fatigue": True,
            "hair_loss": True,
            "pale_skin": True,
            "muscle_weakness": False,
            "mood_changes": False,
            "brittle_nails": True,
            "bleeding_gums": False,
            "dry_skin": False,
            "cold_intolerance": False,
            "slow_healing": False
        },
        "labs": {
            "hemoglobin_g_dl": 10.2,
            "vit_d_ng_ml": 15.0,
            "vit_b12_pg_ml": 180.0,
            "serum_iron_mcg_dl": 40.0,
            "calcium_mg_dl": 9.2
        }
    }

    response = client.post("/api/assessment/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "overall_health_score" in data
    assert "detected_deficiencies" in data
    assert "bayesian_lab_updates" in data
    assert "shap_explanations" in data
    
    # Assert deficiencies are returned with the new model labels
    deficiencies = [d["deficiency"] for d in data["detected_deficiencies"]]
    assert len(deficiencies) > 0
    
    # With very low lab values, Iron and Vit D should be detected at high risk
    assert "Iron Deficiency (Anemia)" in deficiencies
    assert "Vitamin D Deficiency" in deficiencies
    
    # Wellness score should be an integer
    assert isinstance(data["overall_health_score"], int)

def test_13_feature_assessment_endpoint():
    """Test the new /api/assess endpoint directly."""
    payload = {
        "profile": {
            "name": "Jane",
            "age": 25,
            "gender": "Female",
            "weight_kg": 55.0,
            "height_cm": 160.0,
            "dietary_restrictions": []
        },
        "logged_foods": [
            { "food_id": "food_1", "food_name": "Spinach", "serving_g": 100, "meal_type": "Lunch", "date": "2026-08-11" },
            { "food_id": "food_2", "food_name": "Lentils", "serving_g": 150, "meal_type": "Dinner", "date": "2026-08-12" },
            { "food_id": "food_3", "food_name": "Rajma", "serving_g": 150, "meal_type": "Lunch", "date": "2026-08-13" }
        ],
        "symptoms": {
            "fatigue": False, "hair_loss": False, "pale_skin": False,
            "muscle_weakness": False, "mood_changes": False, "brittle_nails": False,
            "bleeding_gums": False, "dry_skin": False, "cold_intolerance": False,
            "slow_healing": False
        }
    }

    response = client.post("/api/assess", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "overall_health_score" in data
    assert "detected_deficiencies" in data
    assert "feature_vector" in data
    
    # Feature vector should have exactly 13 features
    fv = data["feature_vector"]
    assert len(fv) == 13
    assert "gender" in fv
    assert "age_years" in fv
    assert "calories_kcal" in fv
    assert "protein_g" in fv
    assert "iron_mg" in fv
    assert "calcium_mg" in fv
    assert "vitamin_d_mcg" in fv
    assert "vitamin_b12_mcg" in fv
    assert "folate_mcg" in fv
    assert "vitamin_a_mcg" in fv
    assert "vitamin_c_mg" in fv
    assert "magnesium_mg" in fv
    assert "zinc_mg" in fv

def test_7day_meal_plan_generation():
    payload = {
        "profile": {
            "name": "Test Subject",
            "age": 25,
            "gender": "Male",
            "weight_kg": 75.0,
            "height_cm": 178.0,
            "dietary_restrictions": ["Vegan"],
            "health_goals": []
        },
        "logged_foods": [],
        "symptoms": {
            "fatigue": True,
            "hair_loss": False,
            "pale_skin": False,
            "muscle_weakness": True,
            "mood_changes": False,
            "brittle_nails": False,
            "bleeding_gums": False,
            "dry_skin": False,
            "cold_intolerance": False,
            "slow_healing": False
        }
    }

    response = client.post("/api/meal-plan/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "meal_plan" in data
    assert len(data["meal_plan"]) == 7 # 7 days

def test_user_registration_and_login():
    import uuid
    test_email = f"jane_{uuid.uuid4().hex[:6]}@example.com"
    # 1. Register new user
    reg_payload = {
        "name": "Jane Doe",
        "email": test_email,
        "password": "securepassword",
        "age": 29,
        "gender": "Female",
        "dietary_restrictions": ["Vegan"]
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "token" in reg_data
    assert reg_data["user"]["name"] == "Jane Doe"

    # 2. Login user
    login_payload = {
        "email": test_email,
        "password": "securepassword"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["token"] == reg_data["token"]

def test_model_metadata_endpoint():
    """Verify model metadata returns the 13-feature set."""
    response = client.get("/api/model/metadata")
    assert response.status_code == 200
    data = response.json()
    
    assert "feature_names" in data
    assert len(data["feature_names"]) == 13
    assert "target_cols" in data
    assert len(data["target_cols"]) == 10
    assert "target_labels_map" in data


def test_assessment_integration_score_and_days():
    """Integration test to verify Wellness Score and distinct_diary_days constraint & dynamic updates."""
    # 1. First run with 3 distinct diary days with low nutrients
    payload_low = {
        "profile": {
            "name": "Jane",
            "age": 25,
            "gender": "Female",
            "weight_kg": 55.0,
            "height_cm": 160.0,
            "dietary_restrictions": []
        },
        "logged_foods": [
            { "food_id": "8810", "food_name": "Spinach", "serving_g": 10, "meal_type": "Lunch", "date": "2026-08-11" },
            { "food_id": "8229", "food_name": "Lentils", "serving_g": 10, "meal_type": "Dinner", "date": "2026-08-12" },
            { "food_id": "8762", "food_name": "Rajma", "serving_g": 10, "meal_type": "Lunch", "date": "2026-08-13" }
        ],
        "symptoms": {
            "fatigue": False, "hair_loss": False, "pale_skin": False,
            "muscle_weakness": False, "mood_changes": False, "brittle_nails": False,
            "bleeding_gums": False, "dry_skin": False, "cold_intolerance": False,
            "slow_healing": False
        }
    }
    response_low = client.post("/api/assess", json=payload_low)
    assert response_low.status_code == 200
    data_low = response_low.json()
    assert "overall_health_score" in data_low
    assert "distinct_diary_days" in data_low
    assert data_low["distinct_diary_days"] == 3
    score_low = data_low["overall_health_score"]
    assert 0 <= score_low <= 100

    # 2. Run again with high nutrients (changes risk probabilities)
    payload_high = {
        "profile": {
            "name": "Jane",
            "age": 25,
            "gender": "Female",
            "weight_kg": 55.0,
            "height_cm": 160.0,
            "dietary_restrictions": []
        },
        "logged_foods": [
            { "food_id": "8810", "food_name": "Spinach", "serving_g": 800, "meal_type": "Lunch", "date": "2026-08-11" },
            { "food_id": "8229", "food_name": "Lentils", "serving_g": 800, "meal_type": "Dinner", "date": "2026-08-12" },
            { "food_id": "8762", "food_name": "Rajma", "serving_g": 800, "meal_type": "Lunch", "date": "2026-08-13" }
        ],
        "symptoms": {
            "fatigue": False, "hair_loss": False, "pale_skin": False,
            "muscle_weakness": False, "mood_changes": False, "brittle_nails": False,
            "bleeding_gums": False, "dry_skin": False, "cold_intolerance": False,
            "slow_healing": False
        }
    }
    response_high = client.post("/api/assess", json=payload_high)
    assert response_high.status_code == 200
    data_high = response_high.json()
    assert data_high["distinct_diary_days"] == 3
    score_high = data_high["overall_health_score"]
    assert 0 <= score_high <= 100
    
    # Confirm that changing the underlying food data/risk probabilities changes the score
    assert score_high != score_low

def test_vegetarian_meal_plan_filtering():
    """Verify that a 7-day meal plan generated for a Vegetarian user contains 0 non-vegetarian meals across all 28 slots."""
    payload = {
        "profile": {
            "name": "Vegetarian User",
            "age": 28,
            "gender": "Female",
            "weight_kg": 62.0,
            "height_cm": 168.0,
            "dietary_restrictions": ["Vegetarian"],
            "health_goals": ["Optimize energy"]
        },
        "logged_foods": [
            { "food_id": "8810", "food_name": "Spinach", "serving_g": 100, "meal_type": "Lunch", "date": "2026-08-11" },
            { "food_id": "8229", "food_name": "Lentils", "serving_g": 100, "meal_type": "Dinner", "date": "2026-08-12" },
            { "food_id": "8762", "food_name": "Rajma", "serving_g": 100, "meal_type": "Lunch", "date": "2026-08-13" }
        ],
        "symptoms": { "fatigue": True }
    }

    response = client.post("/api/meal-plan/generate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "meal_plan" in data
    meal_plan = data["meal_plan"]
    assert len(meal_plan) == 7

    non_veg_words = [
        "beef", "liver", "chicken", "salmon", "cod", "fish", "meat", "pork", 
        "mutton", "turkey", "sardine", "sardines", "seafood", "shrimp", "prawn", 
        "tuna", "bacon", "lamb", "anchovy", "crab", "lobster"
    ]

    total_meals_checked = 0
    for day in meal_plan:
        for mtype in ["breakfast", "lunch", "dinner", "snack"]:
            meal = day["meals"][mtype]
            title_lower = meal["title"].lower()
            for forbidden in non_veg_words:
                assert forbidden not in title_lower, f"Non-veg word '{forbidden}' found in vegetarian meal plan title: '{meal['title']}' on {day['day']} {mtype}"
            total_meals_checked += 1

    assert total_meals_checked == 28


def test_dairy_free_assessment_and_meal_plan_filtering():
    """Verify that a Dairy-Free user receives ZERO dairy products (curd, milk, paneer, yogurt, cheese, butter, ghee) in recommendations or meal plans."""
    payload = {
        "profile": {
            "name": "Dairy-Free User",
            "age": 28,
            "gender": "Female",
            "weight_kg": 62.0,
            "height_cm": 168.0,
            "dietary_restrictions": ["Dairy-Free"],
            "health_goals": ["Address Fatigue"]
        },
        "logged_foods": [
            { "food_id": "8810", "food_name": "Spinach", "serving_g": 100, "meal_type": "Lunch", "date": "2026-08-11" },
            { "food_id": "8229", "food_name": "Lentils", "serving_g": 100, "meal_type": "Dinner", "date": "2026-08-12" },
            { "food_id": "8762", "food_name": "Rajma", "serving_g": 100, "meal_type": "Lunch", "date": "2026-08-13" }
        ],
        "symptoms": { "fatigue": True }
    }

    # 1. Assessment Recommendations check
    resp_assess = client.post("/api/assess", json=payload)
    assert resp_assess.status_code == 200
    data_assess = resp_assess.json()
    recs = data_assess.get("recommendations", {})

    dairy_words = ["curd", "curds", "dahi", "yogurt", "paneer", "whey", "dairy", "cheese", "butter", "ghee", "cream", "shrikhand", "cottage cheese"]

    for def_name, rec_info in recs.items():
        foods = rec_info.get("recommended_foods", [])
        for f_item in foods:
            f_lower = f_item.lower()
            if "soy milk" in f_lower or "almond milk" in f_lower or "oat milk" in f_lower:
                continue
            for d_term in dairy_words + ["milk"]:
                assert d_term not in f_lower, f"Dairy item '{d_term}' found in dairy-free recommendation: '{f_item}' for {def_name}"

    # 2. Meal Plan Generation check
    resp_mp = client.post("/api/meal-plan/generate", json=payload)
    assert resp_mp.status_code == 200
    data_mp = resp_mp.json()
    meal_plan = data_mp["meal_plan"]

    for day in meal_plan:
        for mtype in ["breakfast", "lunch", "dinner", "snack"]:
            title = day["meals"][mtype]["title"].lower()
            if "soy milk" in title or "almond milk" in title or "oat milk" in title:
                continue
            for d_term in dairy_words + ["milk"]:
                assert d_term not in title, f"Dairy term '{d_term}' found in dairy-free meal plan title: '{title}' on {day['day']} {mtype}"


