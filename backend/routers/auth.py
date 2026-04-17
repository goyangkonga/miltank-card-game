from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid, re
from backend.database import get_db
from backend.auth_utils import hash_password, verify_password, create_access_token
from backend.services.gacha_service import draw_cards

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterBody(BaseModel):
    username: str
    nickname: str
    password: str

class LoginBody(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(body: RegisterBody):
    if not re.match(r'^[a-zA-Z0-9]{4,20}$', body.username):
        raise HTTPException(400, "아이디는 영문+숫자 4~20자")
    if not re.match(r'^[\w가-힣]{2,12}$', body.nickname):
        raise HTTPException(400, "닉네임은 2~12자")
    if len(body.password) < 8:
        raise HTTPException(400, "비밀번호는 8자 이상")
    db = get_db()
    if db.execute("SELECT id FROM users WHERE username=?", (body.username,)).fetchone():
        db.close(); raise HTTPException(400, "이미 사용 중인 아이디입니다")
    if db.execute("SELECT id FROM users WHERE nickname=?", (body.nickname,)).fetchone():
        db.close(); raise HTTPException(400, "이미 사용 중인 닉네임입니다")
    uid = str(uuid.uuid4())
    db.execute(
        "INSERT INTO users(id,username,nickname,password_hash) VALUES(?,?,?,?)",
        (uid, body.username, body.nickname, hash_password(body.password))
    )
    db.commit(); db.close()
    return {"message": "회원가입 완료"}

@router.post("/login")
def login(body: LoginBody):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username=?", (body.username,)).fetchone()
    db.close()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "아이디 또는 비밀번호가 틀렸습니다")
    token = create_access_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "nickname": user["nickname"],
        "is_new_user": user["is_new_user"],
        "milk": user["milk"]
    }
