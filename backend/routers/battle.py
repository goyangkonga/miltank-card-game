import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from backend.auth_utils import get_current_user
from backend.database import get_db
from backend.services.battle_service import resolve_battle
from backend.services.gacha_service import ALL_CARDS, add_cards_to_user
from backend.config import MILK_MAX

router = APIRouter(prefix="/battle", tags=["battle"])

def _card_info(card_id: str) -> dict | None:
    return next((c for c in ALL_CARDS if c["id"] == card_id), None)

class QueueBody(BaseModel):
    card_id: str

@router.post("/queue")
def join_queue(body: QueueBody, user=Depends(get_current_user)):
    db = get_db()

    # 보유 카드 확인
    owned = db.execute(
        "SELECT copies FROM user_cards WHERE user_id=? AND card_id=?",
        (user["id"], body.card_id)
    ).fetchone()
    if not owned or owned["copies"] < 1:
        db.close(); raise HTTPException(400, "보유하지 않은 카드입니다")

    # 이미 대기 중인지 확인
    already = db.execute(
        "SELECT id FROM battle_queue WHERE user_id=? AND status='waiting'",
        (user["id"],)
    ).fetchone()
    if already:
        db.close(); raise HTTPException(400, "이미 배틀 대기 중입니다")

    # 상대 찾기
    opponent = db.execute(
        "SELECT * FROM battle_queue WHERE status='waiting' AND user_id!=? ORDER BY queued_at ASC LIMIT 1",
        (user["id"],)
    ).fetchone()

    if not opponent:
        db.execute("INSERT INTO battle_queue(user_id,card_id) VALUES(?,?)",
                   (user["id"], body.card_id))
        db.commit(); db.close()
        return {"status": "waiting", "message": "상대를 기다리는 중..."}

    # 매칭 성사 → 전투 판정
    db.execute("UPDATE battle_queue SET status='matched' WHERE id=?", (opponent["id"],))

    my_card  = _card_info(body.card_id)
    opp_card = _card_info(opponent["card_id"])
    opp_user = db.execute("SELECT * FROM users WHERE id=?", (opponent["user_id"],)).fetchone()

    result = resolve_battle(my_card, opp_card)
    is_my_win = result["winner_card_id"] == body.card_id

    winner_id  = user["id"]   if is_my_win else opponent["user_id"]
    loser_id   = opponent["user_id"] if is_my_win else user["id"]
    winner_card = body.card_id if is_my_win else opponent["card_id"]
    loser_card  = opponent["card_id"] if is_my_win else body.card_id

    # 우유 처리 (승자 획득, 패자 차감 — 최소 0)
    db.execute(
        "UPDATE users SET milk=MIN(?,milk+?) WHERE id=?",
        (MILK_MAX, result["milk_taken"], winner_id)
    )
    db.execute(
        "UPDATE users SET milk=MAX(0,milk-?) WHERE id=?",
        (result["milk_taken"], loser_id)
    )

    # 카드 강탈 (패자 copies -1, 승자 copies +1)
    loser_owns = db.execute(
        "SELECT id,copies FROM user_cards WHERE user_id=? AND card_id=?",
        (loser_id, loser_card)
    ).fetchone()
    if loser_owns and loser_owns["copies"] > 0:
        if loser_owns["copies"] == 1:
            db.execute("DELETE FROM user_cards WHERE id=?", (loser_owns["id"],))
        else:
            db.execute("UPDATE user_cards SET copies=copies-1 WHERE id=?", (loser_owns["id"],))
        add_cards_to_user(winner_id, [_card_info(loser_card)], db)

    # 배틀 로그 저장
    db.execute("""
        INSERT INTO battle_logs
        (winner_id,loser_id,winner_card_id,loser_card_id,
         winner_nickname,loser_nickname,reason,is_upset,
         milk_taken,card_taken,round_scores)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
    """, (
        winner_id, loser_id, winner_card, loser_card,
        (user["nickname"] if is_my_win else opp_user["nickname"]),
        (opp_user["nickname"] if is_my_win else user["nickname"]),
        result["reason"], int(result["is_upset"]),
        result["milk_taken"], 1,
        json.dumps(result["round_scores"])
    ))
    db.commit(); db.close()

    return {
        "status": "matched",
        "is_winner": is_my_win,
        "my_card": my_card,
        "opp_card": opp_card,
        "opp_nickname": opp_user["nickname"],
        "reason": result["reason"],
        "is_upset": result["is_upset"],
        "milk_taken": result["milk_taken"],
        "card_taken": True,
        "round_scores": result["round_scores"],
    }

@router.get("/result/unread")
def get_unread(user=Depends(get_current_user)):
    db = get_db()
    row = db.execute("""
        SELECT * FROM battle_logs
        WHERE (winner_id=? AND winner_read=0)
           OR (loser_id=?   AND loser_read=0)
        ORDER BY created_at DESC LIMIT 1
    """, (user["id"], user["id"])).fetchone()
    db.close()
    if not row:
        return {"has_result": False}
    r = dict(row)
    is_win = r["winner_id"] == user["id"]
    return {
        "has_result": True,
        "log_id": r["id"],
        "is_winner": is_win,
        "is_upset": bool(r["is_upset"]),
        "my_card":  _card_info(r["winner_card_id"] if is_win else r["loser_card_id"]),
        "opp_card": _card_info(r["loser_card_id"]  if is_win else r["winner_card_id"]),
        "opp_nickname": r["loser_nickname"] if is_win else r["winner_nickname"],
        "reason":  r["reason"],
        "milk_taken": r["milk_taken"],
        "card_taken": bool(r["card_taken"]),
        "round_scores": json.loads(r["round_scores"]),
    }

@router.post("/result/{log_id}/read")
def mark_read(log_id: int, user=Depends(get_current_user)):
    db = get_db()
    row = db.execute("SELECT * FROM battle_logs WHERE id=?", (log_id,)).fetchone()
    if not row:
        db.close(); raise HTTPException(404, "결과 없음")
    if row["winner_id"] == user["id"]:
        db.execute("UPDATE battle_logs SET winner_read=1 WHERE id=?", (log_id,))
    elif row["loser_id"] == user["id"]:
        db.execute("UPDATE battle_logs SET loser_read=1 WHERE id=?", (log_id,))
    db.commit(); db.close()
    return {"ok": True}

@router.get("/queue/status")
def queue_status(user=Depends(get_current_user)):
    db = get_db()
    row = db.execute(
        "SELECT * FROM battle_queue WHERE user_id=? AND status='waiting'",
        (user["id"],)
    ).fetchone()
    db.close()
    return {"in_queue": bool(row), "card_id": row["card_id"] if row else None}

@router.delete("/queue")
def leave_queue(user=Depends(get_current_user)):
    db = get_db()
    db.execute("DELETE FROM battle_queue WHERE user_id=? AND status='waiting'", (user["id"],))
    db.commit(); db.close()
    return {"ok": True}
