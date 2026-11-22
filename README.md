# I-ITSM: Intelligent IT Service Management & Incident Resolution System
### CS F213 / MAC F212 Object-Oriented Programming Course Project (2026-2027)

A full-stack, enterprise-grade IT Service Management and Incident Resolution software system built using sound **Object-Oriented Design Principles**, **Four GoF Design Patterns**, and **AI-Assisted Operational Intelligence**.

---

## 🚀 Quick Start (Under 1 Minute)

### Option 1: One-Click Launchers (Windows)
1. Double-click `start_backend.bat`
2. Double-click `start_frontend.bat`
3. Open `http://localhost:5173` in your browser.

### Option 2: Manual Terminal Commands
```bash
# Terminal 1: Backend Server
cd backend
python main.py
# Server runs on http://localhost:8000 (Swagger docs at http://localhost:8000/docs)

# Terminal 2: Frontend Server
cd frontend
npm run dev
# Frontend runs on http://localhost:5173

# Terminal 3: Run Automated Test Suite
cd backend
python -m unittest tests.test_itsm -v
```

---

## 🔑 Pre-Seeded Demo Login Credentials

| Role | Email | Password | Primary Purpose |
|---|---|---|---|
| 👑 **Administrator** | `admin@itsm.com` | `admin123` | Full control center, technician dispatch, reports, audit trail |
| 🛠️ **Technician (Network)** | `tech1@itsm.com` | `tech123` | Technician workbench, incident investigation, resolution |
| 🛠️ **Technician (App/Cloud)** | `tech3@itsm.com` | `tech123` | Application outages, cloud troubleshooting |
| 👤 **Employee** | `emp1@itsm.com` | `emp123` | Report incidents, live status tracking, satisfaction feedback |

---

## 🌟 Key Architectural & OOP Features

### 1. Four Core GoF Design Patterns
- **Strategy Pattern (`backend/patterns/strategy.py`):**
  - Technician Assignment Strategies: *Skill-Based*, *Load-Based*, *Round-Robin*, *Priority-Based*.
  - Priority Determination Strategies: *Basic Priority ($Impact \times Urgency \times Criticality$)* and *Weighted Scoring*.
- **State Pattern (`backend/patterns/state.py`):**
  - Enforces valid lifecycle transitions: `NEW` → `CLASSIFIED` → `ASSIGNED` → `ACKNOWLEDGED` → `IN_PROGRESS` → `RESOLVED` → `VERIFIED` → `CLOSED`.
  - Blocks illegal transitions (e.g. `NEW` → `CLOSED`) via `InvalidStateTransitionError`.
- **Factory Pattern (`backend/patterns/factory.py`):**
  - `UserFactory`: Creates Employee, Technician, and Admin models with appropriate workload caps and permissions.
  - `IncidentFactory`: Generates sequential tickets (`INC-0001`) with initialized states and default attributes.
- **Observer Pattern (`backend/patterns/observer.py`):**
  - Multi-channel notification publisher dispatching events to Email, SMS, and In-App notification observers.

### 2. Intelligent AI Features
- **Duplicate Incident Detection:** Jaccard lexical similarity algorithm flags duplicate outage reports before submission.
- **Automated Incident Categorization:** Analyzes issue narrative and matches category taxonomy (Network, Database, Security, Cloud, etc.).
- **Smart Technician Recommendation:** Evaluates skill overlap, active workload burden, and availability to rank personnel.
- **Historical Resolution Recommendation:** Recommends previous technical solutions from closed incidents in the same category.
- **SLA Early Warning Risk Engine:** Continuously tracks elapsed time and alerts technicians when tickets exceed 80% of allowed resolution time.

### 3. Layered Full-Stack Architecture
- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, Lucide Icons.
- **Backend:** Python FastAPI with asynchronous request handling and Pydantic validation schemas.
- **Persistence:** SQLite 3 database with SQLAlchemy 2.0 ORM.
- **Security:** Bcrypt salted password hashing with OAuth2 JWT tokens.

---

## 📂 Project Structure

```
oops_proj/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint & background SLA monitor
│   ├── database.py                 # SQLAlchemy engine & session setup
│   ├── requirements.txt            # Python dependencies
│   ├── models/                     # SQLAlchemy ORM models (User, Incident, Service, SLA, Audit)
│   ├── schemas/                    # Pydantic request/response schemas
│   ├── routers/                    # API endpoints (auth, incidents, technicians, services, sla, reports, admin)
│   ├── services/                   # Business logic (priority, assignment, sla, audit, intelligent)
│   ├── patterns/                   # OOP Design Patterns (Strategy, State, Factory, Observer)
│   ├── utils/                      # Auth helpers (JWT, bcrypt) and database seeder
│   └── tests/
│       └── test_itsm.py            # Automated test suite (18 unit & integration tests)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── api/                    # Axios API client
│   │   ├── contexts/               # AuthContext (JWT management & session)
│   │   ├── types/                  # Strongly typed TypeScript interfaces
│   │   ├── components/             # Reusable UI widgets (Layout, Sidebar, Header, Badges, SLA Timers)
│   │   └── pages/                  # Route views (Login, Register, Dashboard, Incidents, Detail, Reports, SLA, etc.)
│
├── start_backend.bat               # 1-Click backend launcher
├── start_frontend.bat              # 1-Click frontend launcher
├── run_tests.bat                   # 1-Click automated test runner
├── PROJECT_REPORT.md               # Complete academic project report with all 10 deliverables
└── README.md                       # This document
```

---

## 🧪 Running Automated Tests

Run the test suite covering normal operations, boundary conditions, invalid inputs, exceptions, authorization, business rules, design patterns, and intelligent features:

```bash
cd backend
python -m unittest tests.test_itsm -v
```
**Output:** `Ran 18 tests in 1.25s — OK (100% Pass Rate)`

---

## 📑 Full Project Report
Read `PROJECT_REPORT.md` for:
- Detailed Problem Analysis & Stakeholder Matrix
- Functional & Non-Functional Requirements Specification
- System Architecture Diagrams (Layered & Component Flows)
- UML Use Case and Class Diagrams
- Technology Selection Justification Report (All 9 Evaluator Questions Answered)
- Database ER Schema & Data Dictionaries
- 15–20 Minute Group Video Presentation Script & Demonstration Walkthroughs

