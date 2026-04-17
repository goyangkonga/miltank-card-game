import random
from backend.config import (GRADE_UP, SYNTHESIS_COST, SYNTHESIS_COUNT,
                             SYNTHESIS_FAIL_LOSS, SYNTHESIS_RATE)
from backend.services.gacha_service import CARDS_BY_GRADE, add_cards_to_user

def attempt_synthesis(user_id: str, grade: str, db) -> dict:
    if grade == "레전드":
        return {"success": False, "reason": "레전드는 최고 등급으로 합성 불가"}
    if grade not in GRADE_UP:
        return {"success": False, "reason": "잘못된 등급"}

    # 해당 등급 카드 총 보유 수 (종류 무관)
    rows = db.execute("""
        SELECT uc.card_id, uc.copies FROM user_cards uc
        JOIN (SELECT id FROM (
            SELECT id FROM (VALUES {}) AS t(id)
        )) filtered ON 1=1
        WHERE uc.user_id=?
    """, (user_id,)).fetchall()

    # 간단하게 — 등급 필터는 Python에서
    from backend.services.gacha_service import ALL_CARDS
    grade_ids = {c["id"] for c in ALL_CARDS if c["grade"] == grade}
    rows = db.execute(
        "SELECT card_id, copies FROM user_cards WHERE user_id=?", (user_id,)
    ).fetchall()
    grade_rows = [(r["card_id"], r["copies"]) for r in rows if r["card_id"] in grade_ids]
    total = sum(c for _, c in grade_rows)

    user = db.execute("SELECT milk FROM users WHERE id=?", (user_id,)).fetchone()

    if total < SYNTHESIS_COUNT:
        return {"success": False, "reason": f"재료 부족 ({total}/{SYNTHESIS_COUNT}마리)"}
    if user["milk"] < SYNTHESIS_COST:
        return {"success": False, "reason": f"우유 부족 ({user['milk']}/{SYNTHESIS_COST}개)"}

    # 우유 차감
    db.execute("UPDATE users SET milk=milk-? WHERE id=?", (SYNTHESIS_COST, user_id))

    # 차감 수량 결정
    to_lose = SYNTHESIS_COUNT if random.random() < SYNTHESIS_RATE else SYNTHESIS_FAIL_LOSS
    success = to_lose == SYNTHESIS_COUNT

    # copies 많은 순으로 차감
    grade_rows.sort(key=lambda x: -x[1])
    remaining = to_lose
    for card_id, copies in grade_rows:
        if remaining <= 0:
            break
        lose = min(copies, remaining)
        if lose >= copies:
            db.execute("DELETE FROM user_cards WHERE user_id=? AND card_id=?", (user_id, card_id))
        else:
            db.execute("UPDATE user_cards SET copies=copies-? WHERE user_id=? AND card_id=?",
                       (lose, user_id, card_id))
        remaining -= lose

    result_card = None
    if success:
        result_grade = GRADE_UP[grade]
        pool = CARDS_BY_GRADE.get(result_grade, [])
        result_card = random.choice(pool) if pool else None
        if result_card:
            add_cards_to_user(user_id, [result_card], db)

    db.execute("""
        INSERT INTO synthesis_logs(user_id,grade,result_card_id,success,milk_spent,cards_lost)
        VALUES(?,?,?,?,?,?)
    """, (user_id, grade, result_card["id"] if result_card else None,
          int(success), SYNTHESIS_COST, to_lose))
    db.commit()
    return {"success": success, "result_card": result_card, "cards_lost": to_lose}
