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

def test_deficiency_prediction_with_bayesian_labs():
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
            "hemoglobin_g_dl": 10.2, # Low Hemoglobin -> Iron Anemia
            "vit_d_ng_ml": 15.0,     # Low Vit D
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
    
    # Assert Iron Deficiency and Vit D Deficiency detected with high probability
    deficiencies = [d["deficiency"] for d in data["detected_deficiencies"]]
    assert "Iron Deficiency (Anemia)" in deficiencies
    assert "Vitamin D Deficiency" in deficiencies

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

