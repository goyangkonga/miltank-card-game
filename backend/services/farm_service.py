from datetime import datetime, timezone
from backend.config import MILK_PER_HOUR, MAX_ACCUMULATE_HOURS, MILK_MAX

def calc_pending_milk(user_cards: list, last_collected_at: str | None) -> int:
    if not last_collected_at or not user_cards:
        return 0
    try:
        last = datetime.fromisoformat(last_collected_at).replace(tzinfo=timezone.utc)
    except Exception:
        return 0
    hours = min((datetime.now(timezone.utc) - last).total_seconds() / 3600,
                MAX_ACCUMULATE_HOURS)
    total = sum(int(MILK_PER_HOUR.get(c["grade"], 1) * hours) for c in user_cards)
    return total

def collect_milk(user_id: str, db) -> dict:
    user = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    rows = db.execute(
        "SELECT uc.card_id, uc.copies FROM user_cards uc WHERE uc.user_id=?", (user_id,)
    ).fetchall()

    from backend.services.gacha_service import ALL_CARDS
    card_map = {c["id"]: c for c in ALL_CARDS}
    owned = []
    for r in rows:
        info = card_map.get(r["card_id"])
        if info:
            owned.extend([info] * r["copies"])

    # last_milk_collected 안전하게 접근
    try:
        last_collected = user["last_milk_collected"]
    except Exception:
        last_collected = None
    if not last_collected:
        last_collected = user["created_at"]

    pending = calc_pending_milk(owned, last_collected)
    current = user["milk"]
    addable = min(pending, MILK_MAX - current)
    new_milk = current + addable

    # last_milk_collected 컬럼 없으면 ALTER TABLE 먼저 시도
    try:
        db.execute(
            "UPDATE users SET milk=?, last_milk_collected=? WHERE id=?",
            (new_milk, datetime.now(timezone.utc).isoformat(), user_id)
        )
    except Exception:
        # 컬럼 없으면 추가 후 재시도
        try:
            db.execute("ALTER TABLE users ADD COLUMN last_milk_collected TEXT DEFAULT NULL")
            db.commit()
            db.execute(
                "UPDATE users SET milk=?, last_milk_collected=? WHERE id=?",
                (new_milk, datetime.now(timezone.utc).isoformat(), user_id)
            )
        except Exception:
            db.execute("UPDATE users SET milk=? WHERE id=?", (new_milk, user_id))

    db.commit()
    return {"collected": addable, "total_milk": new_milk, "was_pending": pending}
