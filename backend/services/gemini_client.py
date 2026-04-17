import os, json, re
import google.generativeai as genai
from backend.config import GEMINI_API_KEY, GRADE_ORDER

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")

_PROMPT = """당신은 젖소 카드 배틀 판정관입니다.
규칙:
- 판정 근거는 반드시 카드의 등급/이름/묘사 텍스트만 사용하세요.
- 카드에 없는 능력·스탯·설정 추가는 절대 금지입니다.
- 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이.
{
  "winner_candidate": "A" 또는 "B",
  "upset_possible": true 또는 false,
  "reason": "판정 근거 2~3문장"
}
upset_possible은 하위 등급 카드가 이름/묘사 상성으로 역전 가능한 논리가 있을 때만 true."""

def judge_battle(card_a: dict, card_b: dict) -> dict:
    prompt = f"""{_PROMPT}

[카드 A]
등급: {card_a['grade']}
이름: {card_a['name']}
묘사: {card_a['description']}

[카드 B]
등급: {card_b['grade']}
이름: {card_b['name']}
묘사: {card_b['description']}"""
    try:
        resp = _model.generate_content(prompt)
        text = re.sub(r"```json|```", "", resp.text).strip()
        return json.loads(text)
    except Exception as e:
        return {"winner_candidate": "A", "upset_possible": False,
                "reason": f"판정 오류 (기본값 적용): {str(e)}"}
