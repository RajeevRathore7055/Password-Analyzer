"""routers/analyze.py — Module 1 (strength), Module 4 (tips & education)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.scan_history import ScanHistory
from schemas.analyze_schema import AnalyzeRequest, TipsRequest
from services.password_service import rule_based_score, generate_context_tips, get_education_content
from ml.strength_model import predict_strength
from utils.auth_utils import get_optional_user

router = APIRouter(prefix="/api", tags=["Password Analysis"])


@router.post("/analyze")
def analyze(data: AnalyzeRequest, db: Session = Depends(get_db),
            current_user=Depends(get_optional_user)):
    """Module 1: Rule-based + ML strength analysis. Saves scan if logged in."""
    if not data.password:
        raise HTTPException(400, "Password cannot be empty")
    if len(data.password) > 128:
        raise HTTPException(400, "Password too long (max 128 chars)")

    rule   = rule_based_score(data.password)
    ml     = predict_strength(data.password)
    scan_id = None

    if current_user:
        scan = ScanHistory(
            user_id=current_user.id, rule_score=rule["score"],
            rule_label=rule["label"], ml_label=ml["label"],
            ml_confidence=ml["confidence"], entropy=rule["entropy"],
        )
        db.add(scan); db.commit(); db.refresh(scan)
        scan_id = scan.id

    return {"scan_id": scan_id, "rule_based": rule, "ml": ml}


@router.post("/security-tips")
def get_security_tips(data: TipsRequest):
    """Module 4: Context-aware tips based on detected weakness."""
    if not data.password:
        raise HTTPException(400, "Password cannot be empty")
    if len(data.password) > 128:
        raise HTTPException(400, "Password too long (max 128 chars)")

    rule = rule_based_score(data.password)
    tips = generate_context_tips(data.password, rule)
    return {
        "password_label":       rule["label"],
        "password_score":       rule["score"],
        "problem_type":         tips["problem_type"],
        "context_tips":         tips["context_tips"],
        "extra_tips":           tips["extra_tips"],
        "substitution_example": tips["substitution_example"],
    }


@router.get("/education")
def get_education():
    """Module 4: Static education infographic data."""
    return get_education_content()
