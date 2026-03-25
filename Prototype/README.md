# SecurePass — Prototype v0.1

## Tech Stack
- Frontend : React 18 (simple — no libraries)
- Backend  : Python FastAPI (port 8000)
- ML       : Scikit-learn (3 features)

## How to Run:

### Step 1 — Backend:
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Docs: http://localhost:8000/docs

### Step 2 — Frontend (new terminal):
```
cd frontend
npm install
npm start
```
Website: http://localhost:3000

## Development Journey:
v0.1 → Basic checker + tiny ML  (This)
v0.5 → MySQL + Auth + JWT
v0.8 → HIBP Breach + Advanced ML
v1.0 → Admin + Super Admin
v1.1 → Breach IP Tracking

Feature                     User   Admin    Super Admin

Password analyze            ✅     ✅          ✅
Breach check                ✅     ✅          ✅
Scan history (apni)         ✅     ✅          ✅
Dashboard                   ❌     ✅          ✅
Kisi ki bhi history         ❌     ✅          ✅
Security logs               ❌     ✅          ✅
User add/delete             ❌     ❌          ✅
Ban/unban user              ❌     ❌          ✅
Role change                 ❌     ❌          ✅
Breach IP Tracking          ❌     ❌          ✅