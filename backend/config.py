import os

SECRET_KEY   = os.getenv("SECRET_KEY", "change-this-in-production-please")
ALGORITHM    = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

MILK_MAX       = 9999
MILK_GACHA_COST = 100
SYNTHESIS_COST  = 100
SYNTHESIS_COUNT = 10
SYNTHESIS_FAIL_LOSS = 5
SYNTHESIS_RATE  = 0.5

GRADE_ORDER = ["노말", "레어", "에픽", "레전드"]
GRADE_UP    = {"노말": "레어", "레어": "에픽", "에픽": "레전드"}
GRADE_WEIGHTS = {"노말": 55, "레어": 30, "에픽": 12, "레전드": 3}
MILK_PER_HOUR  = {"노말": 20, "레어": 60, "에픽": 200, "레전드": 600}
MAX_ACCUMULATE_HOURS = 24
