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
    "gender", "age_years", "calories_kcal", "protein_g", "iron_mg", "calcium_mg",
    "vitamin_d_mcg", "vitamin_b12_mcg", "folate_mcg", "vitamin_a_mcg", "vitamin_c_mg",
    "magnesium_mg", "zinc_mg"
]

TARGET_COLS = [
    "label_iron", "label_vitamin_d", "label_vitamin_b12", "label_calcium",
    "label_folate", "label_zinc", "label_vitamin_a", "label_vitamin_c",
    "label_magnesium", "label_protein"
]

TARGET_LABELS_MAP = {
    "label_iron": "Iron Deficiency (Anemia)",
    "label_vitamin_d": "Vitamin D Deficiency",
    "label_vitamin_b12": "Vitamin B12 Deficiency",
    "label_calcium": "Calcium Deficiency",
    "label_folate": "Folate (Vitamin B9) Deficiency",
    "label_zinc": "Zinc Deficiency",
    "label_vitamin_a": "Vitamin A Deficiency",
    "label_vitamin_c": "Vitamin C Deficiency",
    "label_magnesium": "Magnesium Deficiency",
    "label_protein": "Protein Deficiency"
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
    
    print("[INFO] Training Multi-Output Random Forest Classifier with custom hyperparameters...")
    rf_base = RandomForestClassifier(
        n_estimators=500,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features="sqrt",
        bootstrap=True,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    model = MultiOutputClassifier(rf_base)
    model.fit(X_train_scaled, y_train)
    
    # Evaluation
    print("\n" + "="*70)
    print("SCORES — Random Forest (Validation Set)")
    print("="*70)
    
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average="macro")
    f1_micro = f1_score(y_test, y_pred, average="micro")
    
    print(f"Accuracy (overall): {acc:.4f} ({acc*100:.2f}%)")
    print(f"F1 macro:           {f1_macro:.4f}")
    print(f"F1 micro:           {f1_micro:.4f}")
    
    # Per-label metrics
    print("\nPer-label Metrics:")
    roc_aucs = []
    
    # Get probability predictions for ROC-AUC
    raw_probs = model.predict_proba(X_test_scaled)
    
    for idx, col_name in enumerate(TARGET_COLS):
        label_y_test = y_test.iloc[:, idx]
        label_y_pred = y_pred[:, idx]
        
        # F1
        score_f1 = f1_score(label_y_test, label_y_pred)
        
        # ROC-AUC
        if len(raw_probs) > idx and len(raw_probs[idx][0]) > 1:
            prob_positive = raw_probs[idx][:, 1]
            try:
                score_auc = roc_auc_score(label_y_test, prob_positive)
            except Exception:
                score_auc = 0.5
        else:
            score_auc = 0.5
            
        roc_aucs.append(score_auc)
        print(f"  {col_name:<20} | F1: {score_f1:.4f} | ROC-AUC: {score_auc:.4f}")
        
    print("[SUCCESS] Model Trained Successfully!")
    
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
        "f1_macro": f1_macro,
        "f1_micro": f1_micro,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test))
    }
    
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    with open(os.path.join(models_dir, "meta.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    # Sync with fallback directory backend/models
    fallback_dir = os.path.join(os.path.dirname(current_dir), "..", "models")
    os.makedirs(fallback_dir, exist_ok=True)
    
    import shutil
    shutil.copy2(model_path, os.path.join(fallback_dir, "deficiency_model.joblib"))
    shutil.copy2(model_path, os.path.join(fallback_dir, "random_forest_model.pkl"))
    shutil.copy2(scaler_path, os.path.join(fallback_dir, "scaler.joblib"))
    shutil.copy2(meta_path, os.path.join(fallback_dir, "metadata.json"))
    shutil.copy2(meta_path, os.path.join(fallback_dir, "meta.json"))
        
    print(f"[SUCCESS] Artifacts saved in {models_dir} and synced to {fallback_dir}")
    return model, scaler, metadata

if __name__ == "__main__":
    train_and_save_model()
