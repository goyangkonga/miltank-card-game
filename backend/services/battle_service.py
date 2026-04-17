import random
from backend.config import GRADE_ORDER
from backend.services.gemini_client import judge_battle

MILK_REWARD      = 20
UPSET_PROBABILITY = 0.20

def _grade_idx(grade: str) -> int:
    return GRADE_ORDER.index(grade)

def _make_round_scores(is_winner: bool, is_upset: bool) -> list:
    if is_upset:
        scores = ["R", "R", "R", "L", "L"]
        random.shuffle(scores[:3])
        scores[4] = "L"
        return scores
    elif is_winner:
        wins = random.randint(3, 4)
        scores = ["L"] * wins + ["R"] * (5 - wins)
        random.shuffle(scores)
        scores[4] = "L"
        return scores
    else:
        wins = random.randint(1, 2)
        scores = ["L"] * wins + ["R"] * (5 - wins)
        random.shuffle(scores)
        scores[4] = "R"
        return scores

def resolve_battle(card_a: dict, card_b: dict) -> dict:
    ga = _grade_idx(card_a["grade"])
    gb = _grade_idx(card_b["grade"])
    diff = abs(ga - gb)

    # 2등급 이상 차이 → 고등급 무조건 승리
    if diff >= 2:
        winner = card_a if ga > gb else card_b
        loser  = card_b if ga > gb else card_a
        return _result(winner, loser, "등급 차이가 커서 하위 등급은 승리할 수 없습니다.", False)

    gemini = judge_battle(card_a, card_b)
    candidate = gemini.get("winner_candidate", "A")
    upset_ok  = gemini.get("upset_possible", False)
    reason    = gemini.get("reason", "판정 근거 없음")

    # 동급 → Gemini 판정 그대로
    if diff == 0:
        winner = card_a if candidate == "A" else card_b
        loser  = card_b if candidate == "A" else card_a
        return _result(winner, loser, reason, False)

    # 1등급 차이 → 업셋 가능성 체크
    high = card_a if ga > gb else card_b
    low  = card_b if ga > gb else card_a
    if upset_ok and random.random() < UPSET_PROBABILITY:
        return _result(low, high, f"[업셋] {reason}", True)
    return _result(high, low, reason, False)

def _result(winner, loser, reason, is_upset):
    is_upset_flag = is_upset
    return {
        "winner_card_id": winner["id"],
        "loser_card_id":  loser["id"],
        "winner_card":    winner,
        "loser_card":     loser,
        "reason":         reason,
        "is_upset":       is_upset_flag,
        "milk_taken":     MILK_REWARD,
        "card_taken":     True,
        "round_scores":   _make_round_scores(True, is_upset_flag),
    }
