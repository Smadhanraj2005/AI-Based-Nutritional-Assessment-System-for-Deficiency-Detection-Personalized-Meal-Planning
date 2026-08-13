from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class UserProfileSchema(BaseModel):
    name: str = "Alex Morgan"
    age: int = 28
    gender: str = "Female" # Female or Male
    weight_kg: float = 62.0
    height_cm: float = 168.0
    activity_level: str = "Moderate"
    medical_conditions: List[str] = ["Thyroid Sensitivity"]
    dietary_restrictions: List[str] = ["Gluten-Free"]
    health_goals: List[str] = ["Address Fatigue", "Improve Bone Density", "Optimize Energy"]

class UserRegisterSchema(BaseModel):
    name: str
    email: str
    password: str
    age: Optional[int] = 20
    gender: Optional[str] = "Male"
    dietary_restrictions: Optional[List[str]] = []

class UserLoginSchema(BaseModel):
    email: str
    password: str

class AuthResponseSchema(BaseModel):
    token: str
    user: Dict[str, Any]


class LoggedFoodItemSchema(BaseModel):
    food_id: str
    food_name: str
    serving_g: float = 100.0
    meal_type: str = "Breakfast" # Breakfast, Lunch, Dinner, Snack

class DailyFoodDiarySchema(BaseModel):
    date: str = "2026-08-05"
    logged_foods: List[LoggedFoodItemSchema] = []

class SymptomQuestionnaireSchema(BaseModel):
    fatigue: bool = True
    hair_loss: bool = True
    pale_skin: bool = False
    muscle_weakness: bool = False
    mood_changes: bool = True
    brittle_nails: bool = True
    bleeding_gums: bool = False
    dry_skin: bool = False
    cold_intolerance: bool = False
    slow_healing: bool = False

class LabTestReportSchema(BaseModel):
    hemoglobin_g_dl: Optional[float] = 10.5
    vit_d_ng_ml: Optional[float] = 18.2
    vit_b12_pg_ml: Optional[float] = 195.0
    serum_iron_mcg_dl: Optional[float] = 45.0
    calcium_mg_dl: Optional[float] = 8.8

class AssessmentRequestSchema(BaseModel):
    profile: UserProfileSchema
    logged_foods: List[LoggedFoodItemSchema] = []
    symptoms: SymptomQuestionnaireSchema
    labs: Optional[LabTestReportSchema] = None

class AssessmentResponseSchema(BaseModel):
    overall_health_score: int
    detected_deficiencies: List[Dict[str, Any]]
    bayesian_lab_updates: Dict[str, str]
    shap_explanations: Dict[str, Any]
    nutritional_intake_summary: Dict[str, Any]
    recommendations: Dict[str, Any]
