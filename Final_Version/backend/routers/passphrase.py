"""routers/passphrase.py — Module 5: Diceware Passphrase Suggester."""
from fastapi import APIRouter, Query
from services.passphrase_service import generate_passphrase, get_entropy_comparison

router = APIRouter(prefix="/api", tags=["Passphrase Suggester"])


@router.get("/passphrase")
def get_passphrase(words: int = Query(default=4, ge=3, le=8)):
    """Module 5: Generate a Diceware passphrase using OS CSPRNG (secrets module)."""
    return generate_passphrase(num_words=words)


@router.get("/passphrase/compare")
def get_comparison():
    """Module 5: Return entropy comparison table (passphrase vs complex password)."""
    return {"comparison": get_entropy_comparison()}
