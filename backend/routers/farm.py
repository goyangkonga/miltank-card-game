from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.auth_utils import get_current_user
from backend.database import get_db
from backend.services.farm_service import collect_milk
from backend.services.synthesis_service import attempt_synthesis
from backend.config import MILK_MAX

router = APIRouter(prefix="/farm", tags=["farm"])

@router.post("/collect")
def collect(user=Depends(get_current_user)):
    db = get_db()
    result = collect_milk(user["id"], db)
    db.close()
    return result

@router.get("/status")
def farm_status(user=Depends(get_current_user)):
    db = get_db()
    user_row = db.execute("SELECT milk FROM users WHERE id=?", (user["id"],)).fetchone()
    rows = db.execute(
        "SELECT card_id, copies FROM user_cards WHERE user_id=?", (user["id"],)
    ).fetchall()
    db.close()
    return {
        "milk": user_row["milk"],
        "milk_max": MILK_MAX,
        "card_count": sum(r["copies"] for r in rows),
    }

class SynthesisBody(BaseModel):
    grade: str

@router.post("/synthesize")
def synthesize(body: SynthesisBody, user=Depends(get_current_user)):
    db = get_db()
    result = attempt_synthesis(user["id"], body.grade, db)
    db.close()
    if "reason" in result and not result.get("success") and "부족" in result.get("reason",""):
        raise HTTPException(400, result["reason"])
    return result
