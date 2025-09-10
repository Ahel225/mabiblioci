# app.py — FastAPI + SQLite + JWT + Admin
# Déps: fastapi, uvicorn[standard], python-jose[cryptography], pydantic, sqlite-utils

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt, JWTError
from datetime import datetime, timedelta
import sqlite3, os, secrets, string

# --- Config via variables d'environnement ---
SECRET = os.getenv("SECRET", "change_this_super_secret_key")
ALGO = "HS256"
TOKEN_TTL_HOURS = int(os.getenv("TOKEN_TTL_HOURS", 24*30))
DB_PATH = os.getenv("CODES_DB", "codes.db")
ALLOW_ORIGINS = [o.strip() for o in os.getenv("ALLOW_ORIGINS", "*").split(",") if o.strip()]
ADMIN_KEY = os.getenv("ADMIN_KEY", "dev-admin-key")  # change-moi en prod

app = FastAPI(title="mabiblioci-backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB helpers ---
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""CREATE TABLE IF NOT EXISTS codes(
        code TEXT PRIMARY KEY,
        claimed INTEGER DEFAULT 0,
        device_hash TEXT,
        claimed_at TEXT
    )""")
    return conn

# --- Schemas ---
class ClaimReq(BaseModel):
    code: str
    device_hash: str

class CheckReq(BaseModel):
    token: str
    device_hash: str

class GenReq(BaseModel):
    count: int = 10
    length: int = 8

# --- JWT helpers ---
def make_token(code: str, device_hash: str):
    payload = {"sub": code, "dh": device_hash,
               "exp": datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS)}
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def verify_token(token: str):
    return jwt.decode(token, SECRET, algorithms=[ALGO])

# --- Public routes ---
@app.get("/")
def root():
    return {"status": "ok", "service": "mabiblioci-backend"}

@app.post("/api/claim")
def claim(r: ClaimReq):
    conn = db(); cur = conn.cursor()
    code = r.code.strip().upper()
    cur.execute("SELECT code, claimed, device_hash FROM codes WHERE code=?", (code,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(400, "Code invalide")
    _, claimed, dh = row
    if claimed and dh != r.device_hash:
        raise HTTPException(403, "Code déjà utilisé sur un autre appareil")
    if not claimed:
        cur.execute("UPDATE codes SET claimed=1, device_hash=?, claimed_at=? WHERE code=?",
                    (r.device_hash, datetime.utcnow().isoformat(), code))
        conn.commit()
    token = make_token(code, r.device_hash)
    return {"ok": True, "token": token}

@app.post("/api/check")
def check(r: CheckReq):
    try:
        data = verify_token(r.token)
    except JWTError:
        raise HTTPException(401, "Token invalide")
    if data.get("dh") != r.device_hash:
        raise HTTPException(403, "Appareil non autorisé")
    return {"ok": True}

# --- Admin routes (protégées par X-Admin-Key) ---
def ensure_admin(x_admin_key: str | None):
    if not x_admin_key or x_admin_key != ADMIN_KEY:
        raise HTTPException(401, "Clé admin invalide")

@app.post("/api/admin/generate")
def admin_generate(g: GenReq, x_admin_key: str | None = Header(default=None)):
    ensure_admin(x_admin_key)
    alphabet = string.ascii_uppercase + string.digits
    conn = db(); cur = conn.cursor()
    codes = []
    for _ in range(max(1, g.count)):
      code = "".join(secrets.choice(alphabet) for _ in range(max(4, g.length)))
      cur.execute("INSERT OR REPLACE INTO codes(code,claimed) VALUES(?,0)", (code,))
      codes.append(code)
    conn.commit()
    return {"created": len(codes), "codes": codes}

@app.get("/api/admin/list")
def admin_list(x_admin_key: str | None = Header(default=None)):
    ensure_admin(x_admin_key)
    conn = db(); cur = conn.cursor()
    cur.execute("SELECT code, claimed, IFNULL(device_hash,''), IFNULL(claimed_at,'') FROM codes ORDER BY claimed, code")
    rows = cur.fetchall()
    return {"count": len(rows), "items": [{"code":c, "claimed":bool(cl), "device_hash":dh, "claimed_at":ca} for c,cl,dh,ca in rows]}

