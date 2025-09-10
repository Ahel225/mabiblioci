# Hub — Carte "Salaires" protégée par code (lié à l'appareil)

## Fichiers
- `index.html` — page d'accueil avec la carte protégée.
- `access-gate.js` — gestion du code et du token lié à l'appareil.
- `server/app.py` — backend FastAPI (SQLite + JWT).

## Backend
```bash
cd server
pip install fastapi uvicorn "python-jose[cryptography]" pydantic sqlite-utils
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
Ajouter des codes dans `codes.db` :
```bash
sqlite3 codes.db "INSERT INTO codes(code,claimed) VALUES('ABC12345',0);"
sqlite3 codes.db "INSERT INTO codes(code,claimed) VALUES('XYZ98765',0);"
```

## Frontend
- Modifie `API_BASE` dans `access-gate.js`.
- `SALAIRES_URL` pointe vers `salaire.html` (change si besoin).
