"""schemas/analyze_schema.py — Pydantic models for analysis endpoints."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class AnalyzeRequest(BaseModel):
    password: str

class TipsRequest(BaseModel):
    password: str

class BreachRequest(BaseModel):
    password: str
    scan_id:  Optional[int] = None

class TipsResponse(BaseModel):
    password_label:       str
    password_score:       int
    problem_type:         str
    context_tips:         List[str]
    extra_tips:           List[str]
    substitution_example: Optional[str]
