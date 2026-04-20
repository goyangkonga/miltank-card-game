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
    # 쿨다운 갱신만 — 카드 저장은 /draw/confirm 으로
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
    # 우유 차감만 — 카드 저장은 /draw/confirm 으로
    db.execute("UPDATE users SET milk=milk-? WHERE id=?", (MILK_GACHA_COST, user["id"]))
    db.commit(); db.close()
    return {"cards": cards, "type": "milk"}

@router.post("/draw/new-user")
def new_user_draw(user=Depends(get_current_user)):
    if not user["is_new_user"]:
        raise HTTPException(400, "이미 신규 혜택을 받았습니다")
    # 카드 데이터만 반환 — 저장은 /draw/confirm 으로 한 장씩 처리
    cards = draw_cards(10)
    db = get_db()
    db.execute("UPDATE users SET is_new_user=0 WHERE id=?", (user["id"],))
    db.commit(); db.close()
    return {"cards": cards, "type": "new_user"}

@router.post("/draw/confirm")
def confirm_draw(body: dict, user=Depends(get_current_user)):
    """짜기 완료 후 카드 1장 저장"""
    from pydantic import BaseModel
    card_id = body.get("card_id")
    if not card_id:
        raise HTTPException(400, "card_id 필요")
    card = _card_info(card_id)
    if not card:
        raise HTTPException(400, "존재하지 않는 카드")
    db = get_db()
    add_cards_to_user(user["id"], [card], db)
    db.close()
    return {"ok": True, "card": card}

@router.get("/draw/free/status")
def free_draw_status(user=Depends(get_current_user)):
    ok, remaining = can_free_draw(user["last_free_draw"])
    return {"can_draw": ok, "remaining_seconds": remaining}
