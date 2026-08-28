from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class UserProfileSchema(BaseModel):
    name: str = "Alex Morgan"
    email: Optional[str] = None
    password: Optional[str] = None
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
    id: Optional[int] = None
    user_id: Optional[int] = None
    date: Optional[str] = None
    food_id: str
    food_name: str
    serving_g: float = 100.0
    meal_type: str = "Breakfast" # Breakfast, Lunch, Dinner, Snack
    calories: Optional[float] = None
    calories_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    iron_mg: Optional[float] = None
    calcium_mg: Optional[float] = None
    vitamin_d_mcg: Optional[float] = None
    vitamin_b12_mcg: Optional[float] = None
    folate_mcg: Optional[float] = None
    vitamin_a_mcg: Optional[float] = None
    vitamin_c_mg: Optional[float] = None
    magnesium_mg: Optional[float] = None
    zinc_mg: Optional[float] = None

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
    hemoglobin_g_dl: Optional[float] = None
    serum_vitamin_d: Optional[float] = None
    vit_d_ng_ml: Optional[float] = None
    vit_b12_pg_ml: Optional[float] = None
    vitamin_b12: Optional[float] = None
    serum_iron_mcg_dl: Optional[float] = None
    ferritin: Optional[float] = None
    calcium_mg_dl: Optional[float] = None
    calcium: Optional[float] = None

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
    distinct_diary_days: Optional[int] = None
    assessment_id: Optional[int] = None
    feature_vector: Optional[Dict[str, Any]] = None

