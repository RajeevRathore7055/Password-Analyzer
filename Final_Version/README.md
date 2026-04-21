# 🛡️ SecurePass — Password Strength Analyser & Breach Checker

**B.Tech 6th Semester | CSE | Mini Project 3 | Final Version (Last)**

A security-focused, stateless web application that analyses password strength using entropy-based scoring and pattern detection, checks passwords against known breach databases using the k-Anonymity model, generates cryptographically secure replacements, and educates users about password security best practices.

> **Privacy Guarantee:** The actual password is never stored, never logged, and never transmitted — all sensitive analysis happens client-side in the browser.

---

## ✨ Features

| Module | Feature | Technology |
|--------|---------|------------|
| **Module 1** | Real-time entropy-based strength analysis (log2 formula) | React.js + Rule Engine |
| **Module 2** | Breach check via HaveIBeenPwned k-Anonymity (5-char SHA-1 prefix only) | FastAPI + httpx + HIBP API |
| **Module 3** | Cryptographically secure password generator | Python `secrets` module (OS CSPRNG) |
| **Module 4** | Context-aware security tips + education infographic | zxcvbn-style feedback logic |
| **Module 5** | Diceware passphrase suggester with entropy comparison | EFF wordlist + `secrets.choice()` |
| **Module 6** | Admin analytics dashboard (anonymous stats only) | Chart.js + SQLite + FastAPI |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js 18, React Router v6, Axios |
| **Backend** | Python 3.11+, FastAPI 0.111, Uvicorn |
| **Database** | MySQL (via SQLAlchemy + PyMySQL) |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **Breach Check** | HaveIBeenPwned API — k-Anonymity model |
| **ML Model** | Scikit-learn Logistic Regression (12 features) |
| **Passphrase** | EFF Diceware wordlist + Python `secrets` (CSPRNG) |
| **HTTP Client** | httpx (async-compatible, replaces sync `requests`) |

---

## 📁 Project Structure

```
SecurePass/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── database.py                # SQLAlchemy engine + session factory
│   ├── config.py                  # Environment config helpers
│   ├── requirements.txt           # All Python dependencies
│   ├── .env                       # Environment variables (fill in your values)
│   ├── .env.example               # Template for .env
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                # Register, Login, Me endpoints
│   │   ├── analyze.py             # Module 1 + Module 4 endpoints
│   │   ├── breach.py              # Module 2 — HIBP breach check
│   │   ├── history.py             # Scan history (auth required)
│   │   ├── passphrase.py          # Module 5 — Diceware passphrase
│   │   └── admin.py               # Module 6 — Admin dashboard
│   ├── services/
│   │   ├── password_service.py    # Entropy scoring + context tips engine
│   │   ├── breach_service.py      # k-Anonymity HIBP integration (httpx)
│   │   └── passphrase_service.py  # Diceware generation + comparison table
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # User ORM model
│   │   ├── scan_history.py        # Scan history ORM model
│   │   ├── login_log.py           # Login log ORM model
│   │   └── breach_alert.py        # Breach alert ORM model
│   ├── schemas/
│   │   ├── analyze_schema.py      # Pydantic models for analysis
│   │   ├── auth_schema.py         # Pydantic models for auth
│   │   └── admin_schema.py        # Pydantic models for admin
│   ├── utils/
│   │   └── auth_utils.py          # JWT create/decode, bcrypt, role guards
│   └── ml/
│       ├── strength_model.py      # Feature extraction + ML prediction
│       ├── train_model.py         # Training script
│       └── password_model.pkl     # Pre-trained Logistic Regression model
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js                 # Routes + auth guards
│       ├── index.js
│       ├── index.css              # Global dark futuristic theme
│       ├── components/
│       │   └── Navbar.js          # Navigation bar
│       ├── context/
│       │   └── AuthContext.js     # JWT auth state
│       ├── services/
│       │   └── api.js             # Axios API service layer
│       └── pages/
│           ├── Login.js           # Login page
│           ├── Register.js        # Registration page
│           ├── Analyzer.js        # Module 1 — Password Analyzer
│           ├── SecurityTips.js    # Module 4 — Tips & Education
│           ├── Passphrase.js      # Module 5 — Passphrase Suggester
│           ├── History.js         # Scan history page
│           └── AdminDash.js       # Module 6 — Admin dashboard
└── database/
    ├── schema.sql                 # Full DB schema
    ├── alter_roles.sql            # Role migration SQL
    └── breach_alerts.sql          # Breach alerts table SQL
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- MySQL Server 8.0+
- Git

---

### Step 1 — Clone / Extract the Project

```bash
# If you have the ZIP:
unzip SecurePass_Final.zip
cd SecurePass
```

---

### Step 2 — MySQL Database Setup

Open MySQL and run:

```sql
CREATE DATABASE securepass_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then import the schema:

```bash
mysql -u root -p securepass_db_final_3.1.0 < database/schema.sql
```

---

### Step 3 — Backend Setup

```bash
cd backend

# Copy and fill in environment variables
cp .env.example .env
# Edit .env — set DB_PASSWORD and generate secret keys

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`  
API documentation: `http://localhost:8000/docs`

---

### Step 4 — Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the React development server
npm start
```

Frontend will open at: `http://localhost:3000`

---

### Quick Start (Windows)

```
Double-click: start.bat
```

### Quick Start (Linux / Mac)

```bash
chmod +x start.sh
./start.sh
```

---

### Step 5 — Create Admin Account

After the backend starts, register a user normally via the UI at `/register`, then promote it to admin directly in MySQL:

```sql
USE securepass_db;
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🔐 Environment Variables

Edit `backend/.env`:

```env
JWT_SECRET_KEY=<64-char random hex>    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=<64-char random hex>
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=securepass_db
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/api/health` | Health check + DB status | None |
| POST | `/api/auth/register` | Register new user | None |
| POST | `/api/auth/login` | Login + get JWT token | None |
| GET | `/api/auth/me` | Get current user | JWT |
| POST | `/api/analyze` | Module 1: Strength analysis | Optional |
| POST | `/api/security-tips` | Module 4: Context-aware tips | None |
| GET | `/api/education` | Module 4: Education content | None |
| POST | `/api/breach/check` | Module 2: HIBP breach check | Optional |
| GET | `/api/passphrase` | Module 5: Generate passphrase | None |
| GET | `/api/passphrase/compare` | Module 5: Entropy comparison | None |
| GET | `/api/history` | Scan history | JWT |
| DELETE | `/api/history/{id}` | Delete scan record | JWT |
| GET | `/api/admin/stats` | Module 6: Dashboard stats | Admin JWT |
| GET | `/api/admin/users` | User management | Admin JWT |

---

## 🧪 Usage Guide

### Analyzing a Password
1. Go to **Analyzer** (`/analyzer`)
2. Type any password in the input box
3. See real-time: strength meter, entropy (bits), crack time estimate, 9-rule checklist, ML model prediction
4. Click **"Check if Breached"** to run the k-Anonymity HIBP check

### Getting Context-Specific Tips
1. Go to **Tips** (`/security-tips`)
2. Type your password — specific advice based on the exact weakness appears instantly
3. Scroll down for the full Security Education infographic

### Generating a Passphrase
1. Go to **Passphrase** (`/passphrase`)
2. Adjust the word count slider (3–8 words)
3. See entropy calculation and strength label
4. Copy to clipboard with one click

---

## 🔄 Changelog

### v3.0.0 — Final Production Release (April 2026)
**New:**
- ✅ Module 5 — Passphrase Suggester: Diceware algorithm, EFF wordlist, entropy comparison table
- ✅ New backend route: `GET /api/passphrase` and `GET /api/passphrase/compare`
- ✅ New frontend page: `Passphrase.js` with word slider, copy button, comparison table
- ✅ `passphraseAPI` added to `api.js`
- ✅ Passphrase route added to `App.js` and `Navbar.js`

**Bug Fixes:**
- 🐛 **`breach_service.py`**: Replaced sync `requests` library with `httpx` — fixes compatibility with FastAPI async runtime
- 🐛 **`database.py`**: Added `pool_pre_ping=True`, `pool_recycle=1800` — fixes "MySQL server has gone away" crash after idle periods
- 🐛 **`requirements.txt`**: Added missing `httpx==0.27.0` and `email-validator==2.2.0` (required for `EmailStr` in auth schemas)
- 🐛 **`routers/__init__.py`**: Added `passphrase` router import
- 🐛 **`main.py`**: Registered `passphrase.router`

**Improvements:**
- 📝 `.env.example` added — safe template for environment variables
- 📝 `start.sh` added — Linux/Mac startup script
- 📝 All backend files fully documented with docstrings
- 📝 Three-level breach label system: `safe` / `caution` / `danger` with colour coding

### v2.0.0 — Module 4 (April 2026)
- ✅ Module 4 — Security Tips & Education Panel
- ✅ `POST /api/security-tips` — context-aware tips endpoint
- ✅ `GET /api/education` — static education data endpoint
- ✅ `SecurityTips.js` frontend page
- ✅ Module 4 CTA card added to `Analyzer.js`
- ✅ `SecurityTips` route and nav link added

### v1.0.0 — Initial Release (March 2026)
- ✅ Modules 1, 2, 3, 6 implemented
- ✅ FastAPI backend with JWT auth, MySQL, ML model
- ✅ React frontend with dark futuristic theme
- ✅ Admin dashboard with analytics, breach alerts, user management
- ✅ Login/Register with role system (user / admin / superadmin)

---

## ⚠️ Known Limitations

- The EFF wordlist embedded in `passphrase_service.py` is a curated subset (~500 words). For full 7776-word Diceware entropy, load the complete EFF wordlist from file at startup.
- The ML model (`password_model.pkl`) was trained on a synthetic dataset. It is supplementary to the rule-based engine and may disagree on edge cases.
- The HIBP breach check requires internet access. In offline environments, the breach check button will return a network error.

---

## 🔮 Future Improvements

- Load full 7776-word EFF wordlist from `eff_wordlist.txt` at startup for precise entropy
- Add rate limiting (slowapi) to breach check endpoint
- Add password history tracking (warn if a previously used password is re-entered)
- Export scan history to CSV
- Dark/light theme toggle

---

## 👨‍💻 Project Info

| Field | Details |
|-------|---------|
| **Course** | B.Tech 6th Semester — Computer Science & Engineering |
| **Project** | Mini Project 3 — Password Strength Analyser & Breach Checker |
| **Version** | 3.0.0 — Final Production Release |
| **Backend** | Python 3.11+ + FastAPI |
| **Frontend** | React.js 18 |
| **Database** | MySQL 8.0+ |

---

*For HOD Reference — SecurePass is a stateless advisory tool. It analyses, advises, and suggests. It does NOT store passwords, does NOT ban users, and does NOT restrict access. All password analysis happens client-side in the browser.*
