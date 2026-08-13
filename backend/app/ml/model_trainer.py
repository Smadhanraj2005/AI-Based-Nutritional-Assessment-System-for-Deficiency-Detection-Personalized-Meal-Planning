import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import f1_score, accuracy_score, roc_auc_score

try:
    from dataset_generator import generate_nutritional_dataset
except ImportError:
    from app.ml.dataset_generator import generate_nutritional_dataset

FEATURE_COLS = [
    "age", "gender", "bmi",
    "iron_intake_pct", "vit_d_intake_pct", "vit_b12_intake_pct", "calcium_intake_pct", 
    "folate_intake_pct", "zinc_intake_pct", "vit_a_intake_pct", "vit_c_intake_pct", 
    "mag_intake_pct", "iodine_intake_pct",
    "fatigue", "hair_loss", "pale_skin", "muscle_weakness", "mood_changes", 
    "brittle_nails", "bleeding_gums", "dry_skin", "cold_intolerance", "slow_healing",
    "hemoglobin_g_dl", "vit_d_ng_ml", "vit_b12_pg_ml", "serum_iron_mcg_dl", "calcium_mg_dl"
]

TARGET_COLS = [
    "target_iron", "target_vit_d", "target_vit_b12", "target_calcium", 
    "target_folate", "target_zinc", "target_vit_a", "target_vit_c", 
    "target_mag", "target_iodine"
]

TARGET_LABELS_MAP = {
    "target_iron": "Iron Deficiency (Anemia)",
    "target_vit_d": "Vitamin D Deficiency",
    "target_vit_b12": "Vitamin B12 Deficiency",
    "target_calcium": "Calcium Deficiency",
    "target_folate": "Folate (Vitamin B9) Deficiency",
    "target_zinc": "Zinc Deficiency",
    "target_vit_a": "Vitamin A Deficiency",
    "target_vit_c": "Vitamin C Deficiency",
    "target_mag": "Magnesium Deficiency",
    "target_iodine": "Iodine Deficiency"
}

def train_and_save_model():
    print("[INFO] Generating synthetic training dataset based on WHO/NHANES patterns...")
    df = generate_nutritional_dataset(n_samples=3000, random_state=42)
    
    X = df[FEATURE_COLS]
    y = df[TARGET_COLS]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("[INFO] Training Multi-Output Random Forest Classifier...")
    rf_base = RandomForestClassifier(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1)
    model = MultiOutputClassifier(rf_base)
    model.fit(X_train_scaled, y_train)
    
    # Evaluation
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average="macro")
    
    print(f"[SUCCESS] Model Trained Successfully! Accuracy: {acc:.4f} | Macro F1-Score: {f1_macro:.4f}")
    
    # Save Model Artifacts
    current_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(current_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "deficiency_model.joblib")
    scaler_path = os.path.join(models_dir, "scaler.joblib")
    meta_path = os.path.join(models_dir, "metadata.json")
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    metadata = {
        "feature_names": FEATURE_COLS,
        "target_cols": TARGET_COLS,
        "target_labels_map": TARGET_LABELS_MAP,
        "accuracy": acc,
        "f1_macro": f1_macro
    }
    
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"[SUCCESS] Artifacts saved in {models_dir}")
    return model, scaler, metadata

if __name__ == "__main__":
    train_and_save_model()
