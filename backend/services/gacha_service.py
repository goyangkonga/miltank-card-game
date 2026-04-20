import json, os, random
from datetime import datetime, timezone, timedelta
from backend.config import GRADE_WEIGHTS, MILK_GACHA_COST, MILK_MAX

_cards_path = os.path.join(os.path.dirname(__file__), "../data/cards.json")
with open(_cards_path, encoding="utf-8") as f:
    ALL_CARDS = json.load(f)

CARDS_BY_GRADE = {}
for c in ALL_CARDS:
    g = c["grade"]
    CARDS_BY_GRADE.setdefault(g, []).append(c)

FREE_DRAW_COOLDOWN_HOURS = 1/6  # 10분

def draw_one() -> dict:
    grades  = list(GRADE_WEIGHTS.keys())
    weights = list(GRADE_WEIGHTS.values())
    grade   = random.choices(grades, weights=weights, k=1)[0]
    pool    = CARDS_BY_GRADE.get(grade, ALL_CARDS)
    return random.choice(pool)

def draw_cards(n: int = 1) -> list:
    return [draw_one() for _ in range(n)]

def can_free_draw(last_free_draw: str | None) -> tuple[bool, int]:
    if last_free_draw is None:
        return True, 0
    last = datetime.fromisoformat(last_free_draw).replace(tzinfo=timezone.utc)
    remaining = timedelta(hours=FREE_DRAW_COOLDOWN_HOURS) - (datetime.now(timezone.utc) - last)
    secs = int(remaining.total_seconds())
    return secs <= 0, max(0, secs)

def add_cards_to_user(user_id: str, cards: list, db) -> None:
    for card in cards:
        existing = db.execute(
            "SELECT id,copies FROM user_cards WHERE user_id=? AND card_id=?",
            (user_id, card["id"])
        ).fetchone()
        if existing:
            db.execute("UPDATE user_cards SET copies=copies+1 WHERE id=?", (existing["id"],))
        else:
            db.execute("INSERT INTO user_cards(user_id,card_id) VALUES(?,?)", (user_id, card["id"]))
    db.commit()
