import os
import joblib
import json
import numpy as np
from pathlib import Path

# Path to the ML model directory (backend/app/ml/models)
BASE_DIR = Path(__file__).resolve().parent.parent  # <project_root>/backend/app
ML_MODELS_DIR = BASE_DIR / "ml" / "models"

MODEL_PATH = ML_MODELS_DIR / "deficiency_model.joblib"
SCALER_PATH = ML_MODELS_DIR / "scaler.joblib"
METADATA_PATH = ML_MODELS_DIR / "metadata.json"

# Fallback to backend/models if ML models dir is missing
if not MODEL_PATH.exists():
    FALLBACK_DIR = BASE_DIR.parent / "models"
    MODEL_PATH = FALLBACK_DIR / "random_forest_model.pkl"
    SCALER_PATH = FALLBACK_DIR / "scaler.joblib"
    METADATA_PATH = FALLBACK_DIR / "metadata.json"

if not MODEL_PATH.exists():
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.touch()

if not METADATA_PATH.exists():
    METADATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    METADATA_PATH.touch()

# Load the model at import time
model = joblib.load(MODEL_PATH) if MODEL_PATH.stat().st_size > 0 else None

# Load the scaler if present
if SCALER_PATH.exists() and SCALER_PATH.stat().st_size > 0:
    scaler = joblib.load(SCALER_PATH)
else:
    # Fallback dummy scaler that returns input unchanged
    class _DummyScaler:
        def transform(self, X):
            return X
    scaler = _DummyScaler()


# Load metadata and feature columns
with open(METADATA_PATH, "r", encoding="utf-8") as f:
    try:
        metadata = json.load(f)
        feature_columns = metadata.get("feature_names", [])
    except json.JSONDecodeError:
        metadata = {}
        feature_columns = []
    # Ensure required keys exist
    if "target_labels_map" not in metadata:
        metadata["target_labels_map"] = {}
    if "target_cols" not in metadata:
        metadata["target_cols"] = []

# Dummy model fallback if model is None
if model is None:
    class _DummyModel:
        def predict_proba(self, X):
            # Use metadata to determine number of target columns
            target_len = len(metadata.get("target_cols", []))
            # Return equal probability for negative/positive classes
            return [np.array([[0.5, 0.5]]) for _ in range(target_len)]
    model = _DummyModel()

# Exported symbols
__all__ = ["model", "scaler", "metadata", "feature_columns", "MODEL_PATH", "METADATA_PATH", "SCALER_PATH"]
