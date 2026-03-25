# main.py — SecurePass Prototype v0.1
# FastAPI backend — basic password strength + simple ML

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import pickle
import os
import numpy as np
from sklearn.linear_model import LogisticRegression

app = FastAPI(
    title       = "SecurePass Prototype",
    description = "Basic Password Strength Checker v0.1",
    version     = "0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["http://localhost:3000"],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

# ── Simple ML Model (3 features only) ────────────────────────────────────────
def train_model():
    # Features: [length, has_special, has_number]
    X = [
        [3,0,0],[4,0,0],[5,0,0],[6,0,0],[6,0,1],[5,0,1],  # Weak
        [8,0,1],[8,1,0],[9,0,1],[10,1,0],                   # Medium
        [12,1,1],[14,1,1],[16,1,1],[12,1,1],[15,1,1],       # Strong
    ]
    y = [0,0,0,0,0,0, 1,1,1,1, 2,2,2,2,2]
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(np.array(X), np.array(y))
    return model

MODEL_PATH = 'simple_model.pkl'
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, 'rb') as f:
        ml_model = pickle.load(f)
    print("✅ ML model loaded!")
else:
    ml_model = train_model()
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(ml_model, f)
    print("✅ ML model trained and saved!")

# ── Request Schema ────────────────────────────────────────────────────────────
class PasswordRequest(BaseModel):
    password: str

# ── Password Rules ────────────────────────────────────────────────────────────
def check_password(password: str):
    score  = 0
    checks = {}

    checks['length']    = len(password) >= 8
    checks['uppercase'] = bool(re.search(r'[A-Z]', password))
    checks['lowercase'] = bool(re.search(r'[a-z]', password))
    checks['number']    = bool(re.search(r'[0-9]', password))
    checks['special']   = bool(re.search(r'[^a-zA-Z0-9]', password))

    score = sum(20 for v in checks.values() if v)

    if score <= 20:   label = 'Weak'
    elif score <= 60: label = 'Medium'
    else:             label = 'Strong'

    return score, label, checks

# Machine Learning Model = Logistic Regression

def get_ml_prediction(password: str):
    features =[
            len(password),
            1 if re.search(r'[^a-zA-Z0-9]', password) else 0,
            1 if re.search(r'[0-9]', password) else 0,
            ]
    
    pred      = ml_model.predict([features])[0]
    proba     = ml_model.predict_proba([features])[0]
    label_map = {
                    0: 'Weak', 
                    1: 'Medium', 
                    2: 'Strong'
                }
    
    return label_map[pred], round(float(max(proba)) * 100, 1)

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {
        "message": "SecurePass Prototype API v0.1 — FastAPI",
        "docs":    "http://localhost:8000/docs",
        "status":  "running"
    }

@app.post("/check")
def check(data: PasswordRequest):
    if not data.password:
        return {"error": "Password required"}

    score, label, checks = check_password(data.password)
    ml_label, confidence = get_ml_prediction(data.password)

    return {
        "score":      score,
        "label":      label,
        "checks":     checks,
        "ml_label":   ml_label,
        "confidence": confidence
    }
