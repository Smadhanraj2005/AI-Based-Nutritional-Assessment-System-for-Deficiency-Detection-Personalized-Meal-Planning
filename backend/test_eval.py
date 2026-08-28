import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.api.endpoints import predict_deficiency_assessment, AssessmentRequestSchema, UserProfileSchema, SymptomQuestionnaireSchema

req = AssessmentRequestSchema(
    profile=UserProfileSchema(name='Test', age=28, gender='Female', weight_kg=62, height_cm=168, activity_level='Moderate', health_goals=[]),
    logged_foods=[
        {"food_id": "food_1", "food_name": "Spinach", "serving_g": 100.0, "meal_type": "Breakfast", "date": "2026-08-11"},
        {"food_id": "food_2", "food_name": "Lentils", "serving_g": 150.0, "meal_type": "Lunch", "date": "2026-08-12"},
        {"food_id": "food_3", "food_name": "Salmon", "serving_g": 150.0, "meal_type": "Dinner", "date": "2026-08-13"}
    ],
    symptoms=SymptomQuestionnaireSchema(fatigue=True, hair_loss=True, pale_skin=False, muscle_weakness=False, mood_changes=True, brittle_nails=True, bleeding_gums=False, dry_skin=False, cold_intolerance=False, slow_healing=False)
)

res = predict_deficiency_assessment(req, user_id=1)
print("Deficiencies count:", len(res["detected_deficiencies"]))
for d in res["detected_deficiencies"]:
    print(d["deficiency"], "->", d["risk_level"], d["confidence"])

print("\nSHAP Explanations for Iron Deficiency (Anemia):")
import pprint
pprint.pprint(res["shap_explanations"].get("Iron Deficiency (Anemia)", []))

from app.api.endpoints import get_personalized_meal_plan
mp_res = get_personalized_meal_plan(req, user_id=1)
print("\nGenerated Meal Plan focus deficiencies:", mp_res["targeted_deficiencies"])
