from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from backend.auth_utils import get_current_user
from backend.database import get_db
from backend.services.gacha_service import (
    draw_cards, can_free_draw, add_cards_to_user,
    ALL_CARDS, CARDS_BY_GRADE, MILK_GACHA_COST
)
from backend.config import MILK_MAX

router = APIRouter(prefix="/cards", tags=["cards"])

def _card_info(card_id: str) -> dict | None:
    return next((c for c in ALL_CARDS if c["id"] == card_id), None)

@router.get("/collection")
def get_collection(user=Depends(get_current_user)):
    db = get_db()
    rows = db.execute(
        "SELECT card_id, copies FROM user_cards WHERE user_id=?", (user["id"],)
    ).fetchall()
    db.close()
    result = []
    for r in rows:
        info = _card_info(r["card_id"])
        if info:
            result.append({**info, "copies": r["copies"]})
    return {"cards": result}

@router.post("/draw/free")
def free_draw(user=Depends(get_current_user)):
    ok, remaining = can_free_draw(user["last_free_draw"])
    if not ok:
        raise HTTPException(400, detail={"message": "아직 쿨다운 중", "remaining_seconds": remaining})
    cards = draw_cards(1)
    db = get_db()
    add_cards_to_user(user["id"], cards, db)
    db.execute("UPDATE users SET last_free_draw=? WHERE id=?",
               (datetime.now(timezone.utc).isoformat(), user["id"]))
    db.commit(); db.close()
    return {"cards": cards, "type": "free"}

@router.post("/draw/milk")
def milk_draw(user=Depends(get_current_user)):
    if user["milk"] < MILK_GACHA_COST:
        raise HTTPException(400, f"우유 부족 ({user['milk']}/{MILK_GACHA_COST})")
    cards = draw_cards(1)
    db = get_db()
    add_cards_to_user(user["id"], cards, db)
    db.execute("UPDATE users SET milk=milk-? WHERE id=?", (MILK_GACHA_COST, user["id"]))
    db.commit(); db.close()
    return {"cards": cards, "type": "milk"}

@router.post("/draw/new-user")
def new_user_draw(user=Depends(get_current_user)):
    if not user["is_new_user"]:
        raise HTTPException(400, "이미 신규 혜택을 받았습니다")
    cards = draw_cards(10)
    db = get_db()
    add_cards_to_user(user["id"], cards, db)
    db.execute("UPDATE users SET is_new_user=0 WHERE id=?", (user["id"],))
    db.commit(); db.close()
    return {"cards": cards, "type": "new_user"}

@router.get("/draw/free/status")
def free_draw_status(user=Depends(get_current_user)):
    ok, remaining = can_free_draw(user["last_free_draw"])
    return {"can_draw": ok, "remaining_seconds": remaining}
