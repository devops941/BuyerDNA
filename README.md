# BuyerDNA – Customer Purchase Behaviour Segmentation & Retail Insights

BuyerDNA is a production-grade Customer Purchase Behaviour Analytics and Retail Business Intelligence SaaS platform. It combines a modern React + TypeScript frontend, a robust Node.js Express backend with MongoDB Atlas persistence, and a Python FastAPI Machine Learning microservice that calculates RFM segmentation, unsupervised K-Means clustering, PCA dimensionality reduction, repeat purchase dynamics, and customer churn risk.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Vite + React + TS + Tailwind)"]
        UI["Modern BI SaaS Interface (Port 5173 / 80)"]
    end

    subgraph NodeBackend ["Backend (Node.js + Express + TypeScript)"]
        API["REST API Router (Port 5000)"]
        AUTH["JWT & RBAC Authorization"]
        INGEST["Multer CSV/XLSX Ingestion & Validation"]
        JOBS["Async Analysis Orchestrator"]
    end

    subgraph Database ["MongoDB Atlas Cloud Cluster"]
        DB[("Collections: users, datasets, customers, transactions, analysisResults, etc.")]
    end

    subgraph PyML ["Python Machine Learning Microservice (FastAPI)"]
        ML_API["FastAPI Endpoints (Port 8000)"]
        RFM["RFM Scoring Engine"]
        KMEANS["K-Means & Silhouette Engine"]
        PCA["NumPy SVD PCA 2D Engine"]
        BEHAV["Purchase Cadence & Demand Engine"]
        CHURN["Predictive Churn & CLV Engine"]
        REC["Rule-Based Strategy Engine"]
    end

    UI -->|HTTP / REST (JWT)| API
    API --> AUTH
    API --> INGEST
    API --> JOBS
    API <-->|Mongoose ODM| DB
    JOBS -->|HTTP Batch Analysis| ML_API
    ML_API --> RFM & KMEANS & PCA & BEHAV & CHURN & REC
```

---

## 🚀 Key Functional Modules

| Module | Route | Description |
| :--- | :--- | :--- |
| **Executive Overview** | `/` | 8 real-time KPI cards, customer segmentation donut, monthly revenue trajectory, and top spenders. |
| **Data Workspace** | `/workspace` | Dataset repository, active dataset switcher, row and column counts, and raw transaction table inspection. |
| **Dataset Import** | `/import` | Drag-and-drop CSV / Excel upload, file validation, automatic column detection, and custom mapping. |
| **Data Validation** | `/validation` | Structural reliability score (0-100%), missing keys, duplicate invoice detection, and rejected record viewer. |
| **Business Metrics** | `/metrics` | Configurable reference dates, RFM quantile weighting, K-Means cluster count (K: 2–7), and churn inactivity windows. |
| **Customer Analytics** | `/analytics` | Paginated customer intelligence roster with search, multi-factor filtering, and sorting by monetary/frequency/recency. |
| **RFM Analysis** | `/rfm` | Industry-standard 9-segment RFM matrix (*Champions, Loyal, At Risk, Hibernating, etc.*) and quantile distributions. |
| **Customer Segmentation** | `/segmentation` | K-Means clustering profiles with interactive 2D PCA scatter plot and silhouette score evaluation. |
| **ML Model Studio** | `/model-studio` | Live hyper-parameter tuning, real-time Python stdout stream logs, and WCSS Elbow Curve convergence plot. |
| **Behaviour Analysis** | `/behaviour` | Customer order frequency, repeat purchase rates, calendar day-of-week patterns, and price sensitivity tiers. |
| **Demand Insights** | `/demand` | Product category sales volume, inventory unit velocities, and average selling price matrices. |
| **Customer Profiles** | `/profiles` | Individual 360° customer sheet with projected CLV, churn probability, and historical transaction timelines. |
| **Segment Comparison** | `/compare` | Side-by-side comparative diagnostics between two cohorts across headcount, revenue, and frequency. |
| **Marketing Insights** | `/insights` | Automated, data-backed retail intervention playbooks with target segments, rationales, actions, and expected ROI. |
| **Reports & Exports** | `/reports` | One-click report generation and export in CSV and XLSX (Excel) formats. |
| **Analysis History** | `/history` | Historical execution runs, processing durations, and platform-wide administrative audit logs. |
| **Settings** | `/settings` | User profile management, password updates, and microservice connectivity status. |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Framer Motion, TanStack React Query, Axios, React Hot Toast.
- **Backend**: Node.js 20+, Express.js, TypeScript, Mongoose ODM, JWT, Multer, Zod, BCryptJS.
- **Python ML Microservice**: Python 3.11+, FastAPI, Uvicorn, NumPy, SciPy, Pandas, Scikit-learn, Pydantic.
- **Database**: MongoDB Atlas (`cluster0.bsyn8gp.mongodb.net/buyer_dna`).
- **Containerization**: Docker, Docker Compose, Nginx.

---

## 🔑 Default Credentials

The database has been seeded with realistic omnichannel transaction data and the following demo accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@buyerdna.com` | `Admin@123456` |
| **Analyst** | `analyst@buyerdna.com` | `Analyst@123456` |
| **Viewer** | `viewer@buyerdna.com` | `Viewer@123456` |

*(You can also click the quick-fill buttons on the login screen for instant one-click login)*

---

## ⚙️ Environment Variables Configuration

### 1. Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://devops_db_user:FmSuxxKg4ZYRomyt@cluster0.bsyn8gp.mongodb.net/buyer_dna?retryWrites=true&w=majority
JWT_SECRET=buyer_dna_production_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000/ml
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

### 2. Python ML Microservice (`ml-service/.env`)
```env
HOST=0.0.0.0
PORT=8000
API_PREFIX=/ml
SERVICE_SECRET_KEY=buyer_dna_internal_secure_key_2026
DEBUG=True
```

### 3. Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_TITLE=BuyerDNA – Customer Purchase Behaviour Segmentation & Retail Insights
```

---

## 🏃 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Active Internet connection (for MongoDB Atlas cloud connection)

### Step 1: Start the Python ML Service
```bash
cd ml-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Verify: Open `http://127.0.0.1:8000/docs` to see interactive FastAPI Swagger documentation.

### Step 2: Seed Database and Start Node.js Backend
```bash
cd backend
npm install
npm run seed       # Seeds admin accounts and processes initial retail dataset
npm run dev        # Starts Express server on http://localhost:5000
```

### Step 3: Start the Frontend Application
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```
Open your browser at `http://localhost:5173` and log in with `admin@buyerdna.com` / `Admin@123456`.

---

## 🐳 Docker Orchestration

Run all three services with a single command:
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Python ML Service: `http://localhost:8000`

---

## 🧪 Testing

- **Python ML Unit Test Suite**:
  ```bash
  python ml-service/test_ml.py
  ```
  Validates RFM quantiles, K-Means clustering, PCA coordinates, purchase cadence, CLV projections, and recommendation rules.

- **Backend Type-check & Build**:
  ```bash
  cd backend && npm run build
  ```

- **Frontend Type-check & Build**:
  ```bash
  cd frontend && npm run build
  ```

---

## 📄 License
Commercial Enterprise License - Developed for BuyerDNA SaaS.
