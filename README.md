# 젖소 배틀 카드 게임

## 프로젝트 구조

```
├── main.py                    # FastAPI 앱 진입점
├── requirements.txt
├── render.yaml                # Render 배포 설정
├── backend/
│   ├── config.py
│   ├── database.py
│   ├── auth_utils.py
│   ├── data/
│   │   └── cards.json         # 카드 100장 데이터
│   ├── routers/
│   │   ├── auth.py
│   │   ├── cards.py
│   │   ├── battle.py
│   │   └── farm.py
│   └── services/
│       ├── gacha_service.py
│       ├── gemini_client.py
│       ├── battle_service.py
│       ├── farm_service.py
│       └── synthesis_service.py
└── frontend/
    ├── index.html             # 로그인/회원가입
    ├── farm.html              # 농장 메인
    ├── gacha.html             # 뽑기
    ├── collection.html        # 컬렉션/합성
    ├── battle.html            # 배틀
    ├── images/
    │   └── cards/             # ← 여기에 001.png ~ 100.png 넣기
    └── static/
        ├── style.css
        ├── api.js
        ├── gacha.js
        └── battle-scene.js
```

## 이미지 파일 추가 방법

1. `frontend/images/cards/` 폴더에 PNG 파일 추가
2. 파일명 형식: `001.png`, `002.png`, ... `100.png` (3자리 zero-padding)
3. GitHub에 push하면 자동 반영

## 로컬 실행

```bash
pip install -r requirements.txt
export GEMINI_API_KEY=your_key_here
uvicorn main:app --reload
# http://localhost:8000 접속
```

## Render 배포

1. GitHub에 이 저장소 push
2. [render.com](https://render.com) → New Web Service → GitHub 연결
3. 환경변수 설정:
   - `GEMINI_API_KEY`: Google AI Studio에서 발급
   - `SECRET_KEY`: 자동 생성됨
4. Deploy!

## Gemini API 키 발급

1. [aistudio.google.com](https://aistudio.google.com) 접속
2. 구글 계정 로그인
3. "Get API Key" 클릭 → 무료 발급 (신용카드 불필요)
4. Render 환경변수에 `GEMINI_API_KEY`로 등록
