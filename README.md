# JANSETU: AI Civic Infrastructure Intelligence Grid
### *“Every Voice. Every Gap. One Intelligence Layer.”*

---

## 🇮🇳 Executive Overview

**JANSETU** is a scalable, multilingual **Civic Digital Twin** and **Predictive Infrastructure Intelligence Grid** engineered as a **Digital Public Good (DPG)** for the Republic of India. 

Governments across India struggle to aggregate unstructured citizen voices and align them with national infrastructure priorities. Traditional systems operate as passive complaint-ticketing portals that suffer from **Reporting Privilege Bias**: urban, affluent, and digitally-connected pockets generate 90% of grievances, while underdeveloped, tribal, or remote rural corridors remain silent despite acute infrastructure deprivation.

**JANSETU changes the paradigm:**
Instead of a simple chatbot or ticket tracker, JANSETU creates a continuously updated **Civic Digital Twin** across India’s administrative hierarchy (Country → State → District → Block → Village/Ward) by fusing:
1. **Multilingual Citizen Voice** (Tamil, Hindi, Telugu, English) normalized via **Google Speech-to-Text (Chirp 2)** and **Google Cloud Translation**.
2. **Gemini 2.5 Structured Perception** to extract typed infrastructure failure modes, severity ratings, urgency scores, and demographic cohorts.
3. **Vertex AI 768-dim Vector Embeddings** to cluster related requests into unified **Semantic Demand Clusters**.
4. **Google BigQuery Analytical Warehouse** fusing demographics (Census/SECC), infrastructure audits (PMGSY, Jal Jeevan Mission, HMIS), and capital public investments.
5. **The Signature Differentiator: Silent Need Detection Engine** identifying severe infrastructure deficits coexisting with unnaturally low citizen reporting due to digital exclusion.
6. **Policy Sandbox** for counterfactual intervention scenario simulation.
7. **Impact Engine** tracking verified before/after governance outcomes.

---

## 🏆 Key Differentiator: Silent Need Mathematical Engine

Most governance systems assume: **More Complaints = More Need**.

JANSETU investigates the counter-hypothesis:
$$\text{High Infrastructure Need} + \text{High Population Exposure} + \text{Low Citizen Voice} + \text{Digital Connectivity Barrier} \implies \mathbf{Potential\ Silent\ Need\ Signal}$$

### The Demand Shadow Formulation
For any geographic unit $g$ (Block/Taluk or District):

$$I_{\text{need}}(g) = 0.55 \cdot \text{InfraDeficit}(g) + 0.35 \cdot \text{VulnerabilityScore}(g) + 0.10$$

$$V_{\text{voice}}(g) = \min\left(\frac{\text{RequestCount}(g, t)}{\text{Population}(g)} \times \frac{1000}{5.0}, 1.0\right)$$

$$\text{Discrepancy}(g) = I_{\text{need}}(g) - V_{\text{voice}}(g)$$

A **Potential Silent Need Signal** is formally triggered when:
$$\text{Discrepancy}(g) \ge 0.35 \quad \text{AND} \quad \text{InfraDeficit}(g) \ge 0.60 \quad \text{AND} \quad \text{DigitalAccess}(g) \le 0.40$$

> [!IMPORTANT]
> **Policy Safety Guardrail:** The system **never** claims that the AI knows a region "must receive ₹50 Crores" or "deserves a hospital." Outputs are strictly labeled:
> *"Potential Silent Need Signal — requires administrative field validation."*

---

## 🛠️ Google Cloud Technology Stack

| Google Technology | Role in JANSETU Architecture |
| :--- | :--- |
| **Google Gemini 2.5 Pro & Flash** | High-precision structured entity extraction (Typed Pydantic JSON schema mode) and zero-hallucination grounded evidence summaries. |
| **Google Cloud Speech-to-Text (Chirp 2)** | Sub-second transcription across regional Indian dialects (Tamil `ta-IN`, Hindi `hi-IN`, Telugu `te-IN`, Indian English `en-IN`). |
| **Google Cloud Translation Advanced (v3)** | Bidirectional normalization from regional Indian vernacular to English semantic pivot. |
| **Vertex AI Vector Embeddings** | 768-dimensional multilingual dense representations for cross-lingual request fusion. |
| **Google BigQuery & BigQuery GIS** | Petabyte-scale civic data warehouse, spatial GIS joins, vector similarity indexing, and predictive time-series queries. |
| **Google Cloud Storage (GCS)** | Object storage with lifecycle policies for citizen audio voice recordings. |
| **Google Cloud Pub/Sub** | Asynchronous decoupling of citizen voice ingestion from heavy AI perception workers. |
| **Google Cloud Run (v2)** | Autoscaling serverless container hosting the FastAPI backend and React frontend. |

---

## 🏛️ System Architecture & Intelligence Loop

```
[LISTEN]    --> Multilingual Citizen Voice (Tamil/Hindi/Telugu/English) via Speech-to-Text
   │
[FUSE]      --> Gemini 2.5 Structured JSON Extraction & 768-dim Semantic Request Clustering
   │
[DISCOVER]  --> Geospatial Demand Hotspots & Cross-Signal Discovery
   │
[SHADOW]    --> Dual-Layer Fusion Matrix (Voice Density vs. Infrastructure Gap)
   │
[DETECT]    --> Potential Silent Need Detection (High Need + Low Digital Access)
   │
[EXPLAIN]   --> Grounded Evidence Engine ("Why This Region?") with Zero-Hallucination Audit Trail
   │
[SIMULATE]  --> Policy Sandbox: Counterfactual Demographic Exposure & Budget Modeling
   │
[MEASURE]   --> Impact Engine: Closed-loop Pre/Post Intervention Telemetry
```

---

## 🚀 5-Minute Hackathon Demo Script

Follow this step-by-step walkthrough during the hackathon demonstration:

```markdown
1. STEP 1: CITIZEN VOICE INTAKE (Tamil)
   - Navigate to "Citizen Voice" tab.
   - Click "Tamil (தமிழ்)" or click the microphone to speak:
     "எங்கள் கிராமத்திற்கு மாலை 7 மணிக்கு பிறகு பேருந்து வசதி இல்லை, பள்ளி மாணவர்கள் மிகவும் சிரமப்படுகின்றனர்."
   - Click "Submit to Civic Intelligence Grid".
   - SHOW: Real-time STT Chirp-2 transcribing -> Gemini 2.5 Structured Extraction (Category: Transport, Severity: 4, Cohort: Students, Time: Evening) -> Fused into Semantic Cluster `CLS-TRN-041` with 1,847 related reports!

2. STEP 2: NATIONAL COMMAND CENTER
   - Click "Command Center" tab.
   - SHOW: National telemetry: 12,480+ citizen voices, 14 active demand hotspots, 9 potential silent need corridors across Tamil Nadu, Uttar Pradesh, Telangana, and Maharashtra.

3. STEP 3: DEMAND HOTSPOTS
   - Click "Demand Hotspots" tab.
   - SHOW: Harur Block (Dharmapuri, TN) flagged as CRITICAL Hotspot with +42.6% velocity and 84,000 population impacted.

4. STEP 4: DUAL-LAYER DEMAND SHADOW MAP
   - Click "Demand Shadow Map" tab.
   - SHOW: The 2D matrix of Layer A (Voice) vs. Layer B (Need).
   - Point out the 4 quadrants:
     - Upper-Right (Red): Confirmed Demand Hotspots (Harur)
     - Upper-Left (Purple): Potential Silent Need (Aheri Tribal Corridor, Pennagaram)

5. STEP 5: SILENT NEED INVESTIGATION & "WHY THIS REGION?"
   - Click "Silent Need Lab" tab.
   - Open Aheri Tribal Block (Gadchiroli, Maharashtra):
     - Healthcare Deficit: 88%
     - Citizen Reporting Footprint: 4%
     - Digital Penetration: 16% (Severe Digital Exclusion)
     - Discrepancy: +0.84
   - Click "Why This Region? (Evidence)".
   - SHOW: Grounded audit trail referencing National Health Mission (46.2 km to nearest PHC) and Census digital penetration (16%), summarized by Gemini with zero hallucinations.

6. STEP 6: POLICY SANDBOX SIMULATION
   - Click "Policy Sandbox" tab.
   - Select Harur Block -> Transport Sector.
   - Move slider to "+8 Additional Evening Bus Routes".
   - Click "Execute Scenario Simulation".
   - SHOW: Modeled gain: +42,500 citizens benefited, accessibility index jumps from 38% -> 74%, mitigating 4 out of 5 demand clusters.

7. STEP 7: IMPACT ENGINE BEFORE / AFTER
   - Click "Impact Engine" tab.
   - SHOW: Pindra Har Ghar Jal Piped Water Scheme:
     - Before: 38% accessibility, 3,410 monthly complaints.
     - After: 82% accessibility, 612 complaints (-82.1% drop, +54% sentiment turnaround).
```

---

## 💻 Local Quick Start Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm 9+**

### 2. Run Backend
```bash
# Navigate to repository root
cd d:/PROJECT/JANSETU

# Activate virtual environment
backend\.venv\Scripts\activate

# Install dependencies (if not already installed)
backend\.venv\Scripts\pip install -r backend/requirements.txt

# Run FastAPI server
backend\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive API Documentation: **http://127.0.0.1:8000/docs**
- Built Single-Page UI: **http://127.0.0.1:8000/ui/**

### 3. Run Frontend (Vite Hot-Reload Development)
```bash
cd frontend
npm install
npm run dev
```
- Frontend Dev Server: **http://localhost:3000** (proxies `/api` to `localhost:8000`)

### 4. Execute Backend Test Suite
```bash
# Run 10 automated integration tests
backend\.venv\Scripts\pytest -v
```

---

## 📦 Containerized Deployment (Docker & Cloud Run)

### One-Command Docker Run
```bash
docker-compose up --build
```
Access the application at `http://localhost:8000/ui/`.

### Google Cloud Run Deployment
```bash
# Build and submit image to Google Artifact Registry
gcloud builds submit --tag gcr.io/jansetu-gov-ai/jansetu-backend:latest .

# Deploy to Cloud Run v2
gcloud run deploy jansetu-core-service \
  --image gcr.io/jansetu-gov-ai/jansetu-backend:latest \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --set-env-vars ENVIRONMENT=production,BIGQUERY_USE_MOCK=false,GOOGLE_CLOUD_PROJECT=jansetu-gov-ai
```

---

## 🔒 Security & Data Governance

1. **Least-Privilege IAM:** BigQuery and Cloud Run resources use role-based service accounts with narrow query execution permissions.
2. **Zero-Hallucination Guardrails:** Gemini prompts enforce structured Pydantic schemas and strict grounded RAG contexts from BigQuery dimension tables.
3. **Citizen Data Privacy:** Voice recordings have automated 90-day GCS lifecycle deletion policies; citizen telephone numbers or personal identities are never ingested into the analytical layer.
4. **Transparent DPG Policy:** Clearly discloses synthetic benchmark records vs. official government open datasets.

---

## 🏛️ PHASE 2 — DATA ENGINEERING / DATA LAYER

### 1. Data Architecture
JANSETU's data architecture unifies multi-channel citizen input, official administrative registries, demographic deprivation benchmarks, and capital public expenditure into a single BigQuery warehouse.

```
                           CANONICAL INGESTION ARCHITECTURE
 
   [ External Sources ]
     ├── LGD Directory (Ministry of Panchayati Raj)
     ├── Census 2011 / SECC Deprivation Indicators
     ├── PMGSY Road Quality & Jal Jeevan Mission Dashboards
     ├── Public Capex Portals & Scheme Sanctions
     └── Multi-channel Citizen Requests (Web, Voice IVR, WhatsApp)
                             │
                             ▼
   [ Raw / Staging Layer ]
     └── Ingestion Pipelines (pipelines/ingestion/)
                             │
                             ▼
   [ Validation & Privacy Sanitization ]
     ├── Schema & Range Bounds Checking (pipelines/validation/validators.py)
     ├── 5-Level Geographic Hierarchy Integrity (Country -> State -> District -> Block -> Village)
     └── PII Scrubber (Redacts telephone numbers and emails)
                             │
                             ▼
   [ Normalization & Provenance Attribution ]
     ├── Canonical Field Resolution (Aliases & Standard Units)
     ├── ST_GEOGPOINT Centroid & GIS Geometry Synthesis
     └── Provenance Stamp (source, source_date, is_synthetic, ingestion_timestamp)
                             │
                             ▼
   [ BigQuery Canonical Warehouse (12 Tables) ]
     ├── Core Dataset: `jansetu_intel` (Configurable via BIGQUERY_DATASET)
     └── Analytics Dataset: `jansetu_analytics` (Configurable via BIGQUERY_ANALYTICS_DATASET)
```

### 2. BigQuery Datasets & 12 Canonical Tables

| Dataset | Table Name | Purpose / Domain | Partitioning | Clustering | GIS Fields |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `jansetu_intel` | `geography` | 5-level administrative hierarchy (LGD) | None | `state_code, geo_level` | `centroid`, `geometry` (`ST_GEOGPOINT`) |
| `jansetu_intel` | `demographics` | Census & SECC vulnerability indicators | None | `geo_id` | Foreign key to `geography` |
| `jansetu_intel` | `infrastructure` | Gap scores across PMGSY, JJM, HMIS | None | `geo_id, category` | Foreign key to `geography` |
| `jansetu_intel` | `investments` | Public capex projects & scheme works | `DATE(created_at)` | `geo_id, category` | Foreign key to `geography` |
| `jansetu_intel` | `citizen_requests` | Multilingual citizen request facts | `DATE(created_at)` | `geo_id, primary_category` | `location_geog` (`ST_GEOGPOINT`) |
| `jansetu_intel` | `citizen_request_embeddings` | 768-dim multilingual vector representations | None | `geo_id` | VECTOR_SEARCH ready |
| `jansetu_intel` | `demand_clusters` | Synthesized semantic demand clusters | None | `geo_id, category` | `centroid_latitude, centroid_longitude` |
| `jansetu_intel` | `hotspots` | Geospatial civic demand concentrations | None | `geo_id` | `latitude, longitude` |
| `jansetu_intel` | `silent_need_signals` | High deficit vs low reporting signals | None | `geo_id` | `latitude, longitude` |
| `jansetu_intel` | `evidence_records` | Grounded audit citations & evidence trail | `DATE(created_at)` | `geo_id, source` | Foreign key to `geography` |
| `jansetu_intel` | `policy_scenarios` | Counterfactual policy sandbox simulations | None | None | Foreign key to `geography` |
| `jansetu_intel` | `impact_metrics` | Closed-loop pre/post intervention metrics | `DATE(created_at)` | `geo_id, project_id` | Foreign key to `geography` |

### 3. Geographic Hierarchy & LGD Identity
JANSETU strictly enforces the 5-level Indian administrative hierarchy:
- **Level 0 (Country):** `IND` (India)
- **Level 1 (State):** `IND_TN` (Tamil Nadu - LGD 33), `IND_UP` (Uttar Pradesh - LGD 09), `IND_TG` (Telangana - LGD 36), `IND_MH` (Maharashtra - LGD 27)
- **Level 2 (District):** `IND_TN_DHM` (Dharmapuri), `IND_UP_VAR` (Varanasi), `IND_TG_MBN` (Mahabubnagar), `IND_MH_GDC` (Gadchiroli)
- **Level 3 (Block / Taluk):** `IND_TN_DHM_HRR` (Harur), `IND_TN_DHM_PNG` (Pennagaram), `IND_UP_VAR_PND` (Pindra), `IND_UP_VAR_SVP` (Sevapuri), `IND_TG_MBN_JDC` (Jadcherla), `IND_MH_GDC_AHR` (Aheri)
- **Level 4 (Village / Ward):** `IND_TN_DHM_HRR_V01` (Morappur), `IND_TN_DHM_HRR_V02` (Kottapatti), `IND_UP_VAR_PND_V01` (Pindra Bazar), etc.

Every child record must point to a verified parent record. Leaf and branch nodes include WGS84 `latitude` and `longitude` with BigQuery GIS `centroid` points (`ST_GEOGPOINT`).

### 4. Synthetic Data Policy & Provenance
- **Official Open Datasets:** Attributed with authoritative sources (`OFFICIAL_LGD`, `SECC_CENSUS_INDIA`, `GOV_INFRA_AUDIT`).
- **Synthetic Testing Records:** Explicitly tagged with `is_synthetic = TRUE` and `source = "JANSETU_SYNTHETIC_DEMO"`.
- Under no circumstances is synthetic test data presented as official government claims or allocations.

### 5. Running Migrations & Seeding Data

#### Run BigQuery Schema Migration (DDL)
```bash
# In production, apply DDL using bq CLI or the Python migration runner
python -c "from app.db.bigquery_client import db; db.run_migrations()"
```

#### Deterministic & Idempotent Seeding
```bash
# Populates multi-state pilot hierarchy and baseline intelligence data
python -c "from pipelines.seed_india_data import seed_india_pilot_data; seed_india_pilot_data(clear_first=True)"
```

### 6. Data Quality & Diagnostic Verification
The system provides automated data quality telemetry accessible via CLI or REST endpoints:
- `GET /api/v1/data/status`: Reports BigQuery connectivity, canonical dataset configuration, and per-table row counts.
- `GET /api/v1/data/geography/{geo_id}`: Traverses and returns the upward lineage to Country root and immediate child subdivisions.
- `GET /api/v1/data/quality`: Audits row counts, null rates, duplicate counts, synthetic breakdown, and hierarchy integrity.

### 7. Automated Testing
Run the complete regression suite (40 automated tests covering Phase 1 foundation and Phase 2 data engineering):
```bash
backend\.venv\Scripts\pytest -v
```

---

## 🗣️ Phase 3: Multilingual Citizen Input Layer

### 1. Architectural Scope & Principles
Phase 3 establishes the production-grade **Multilingual Citizen Intake Pipeline** designed as an accessible Digital Public Good. It allows citizens across India to express infrastructure gaps in their native mother tongue via audio voice recordings or indigenous text script:
- **Speech-to-Text (Chirp 2):** High-accuracy transcription tailored to regional Indian languages and acoustic environments.
- **Translation Advanced (v3):** High-fidelity translation normalizing regional vernacular into a standardized English semantic pivot without destroying original citizen expression.
- **PII Sanitation:** Automated regex filtering of Indian phone numbers (+91..., 10-digit mobile) and email addresses before long-term analytical storage.
- **Cloud Storage:** Immutable raw audio capture stored deterministically at gs://<bucket>/audio/{YYYY-MM-DD}/{request_id}.{ext}.
- **BigQuery Analytical Persistence:** Structured storage in jansetu_intel.citizen_requests maintaining both original_transcript and 
ormalized_text.
- **Pub/Sub Event Ingestion:** Asynchronous event broadcasting (citizen.request.created) to decouple intake from downstream cluster fusion.

### 2. Supported Languages & Registry
The centralized LANGUAGE_REGISTRY in ackend/app/core/languages.py provides canonical BCP-47 language configuration:

| Language Code | Display Name | Native Name | Script | Chirp 2 STT | Translation v3 | Sample Scenario |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| 	a-IN | Tamil | தமிழ் | Tamil | ✅ | ✅ | Harur Bus Service Gap |
| hi-IN | Hindi | हिन्दी | Devanagari | ✅ | ✅ | Pindra Drinking Water Crisis |
| 	e-IN | Telugu | తెలుగు | Telugu | ✅ | ✅ | Jadcherla PHC Doctor Shortage |
| n-IN | Indian English | English | Latin | ✅ | ✅ | Rural Arterial Road Damage |
| mr-IN | Marathi | मराठी | Devanagari | ✅ | ✅ | Evening Bus Service (Extension) |
| kn-IN | Kannada | ಕನ್ನಡ | Kannada | ✅ | ✅ | Rural Transport (Extension) |

### 3. Citizen Intake Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| POST | /api/v1/intake/text | Ingests native script text, scrubs PII, translates, persists to BigQuery, and publishes to Pub/Sub. | pplication/json |
| POST | /api/v1/intake/voice | Validates audio MIME/size, uploads to GCS, transcribes via Chirp 2, scrubs PII, translates, persists, and publishes event. | multipart/form-data |
| GET | /api/v1/intake/{request_id} | Retrieves non-sensitive processing status, channel, language, geo_id, and timestamps. | pplication/json |
| GET | /api/v1/intake/languages | Lists supported Indian languages with Chirp/Translation support flags and sample phrases. | pplication/json |

### 4. Interactive Citizen Portal Frontend
The frontend CitizenPortal.tsx delivers a native, accessible civic intake interface:
- **4-Language Localization (i18n):** Complete UI localization across Tamil, Hindi, Telugu, and English.
- **Browser MediaRecorder API:** Real-time audio recording with active timer, audio waveform/recording indicator, native audio playback element (<audio controls />), and re-record controls.
- **Live Pipeline Stepper:** Step-by-step processing tracker (TRANSCRIBING → TRANSLATING → SAVED).
- **Data Layer Confirmation:** Request tracking showing 
equest_id, detected language, original submission, English semantic pivot, and BigQuery persistence confirmation.

### 5. Automated Verification & Test Suite
The complete JANSETU automated test suite contains **87 tests with 100% pass rate** across all completed phases:
- **Phase 1 (Foundation):** 19 tests (FastAPI, Firebase Auth, BigQuery/PubSub/Storage client abstractions, centralized error handling).
- **Phase 2 (Data Engineering):** 17 tests (5-level LGD hierarchy, 12 canonical tables, BigQuery GIS, seed pipelines, data quality audit).
- **Phase 3 (Multilingual Intake):** 26 tests (Tamil/Hindi/Telugu/English text, audio validation, Chirp 2 STT, Translation v3 resilience, PII scrubbing, GCS URI paths, status tracking, language registry).
- **Phase 4 (AI Perception & Semantic Clustering):** 21 tests (Gemini extraction across sectors, prompt injection defense, authoritative geo_id preservation, 768-dim embeddings, cross-lingual cosine similarity, demand clustering with true counts, REST endpoints).
- **Prototype Baseline:** 4 tests (Static UI, basic intake).

```bash
# Execute entire 87-test test suite
backend\.venv\Scripts\pytest -v

# Execute Phase 4 AI Perception tests only
backend\.venv\Scripts\pytest -v backend\tests\test_phase4_ai_perception.py
```

---

## 🧠 Phase 4: AI Perception & Semantic Clustering

### 1. Architectural Scope & Principles
Phase 4 transforms raw, unstructured citizen voice submissions from Phase 3 into typed, structured civic intelligence and dense vector representations without hallucination:
- **Google Gemini 2.5 Pro (Structured Extraction):** Uses Pydantic JSON schema mode to extract primary categories, subcategories, concrete issues, severity (1–5), urgency (0.0–1.0), and non-sensitive demographic cohorts.
- **Zero-Hallucination Guardrails:** The model is strictly prohibited from inventing population statistics, budgets, cost estimates, or administrative funding commitments. Output represents citizen perception, not state policy.
- **Prompt-Injection Defense:** Citizen input is strictly isolated within `<CITIZEN_SUBMISSION_DATA>` delimiter blocks. Attempts to override instructions or schema are deflected into safe fallback records.
- **Authoritative Location Immutability:** The verified administrative `geo_id` from Phase 3 is immutable; model guesses from raw text only populate contextual location strings.
- **Controlled Civic Taxonomy:** 12 primary infrastructure categories (`transport`, `water`, `healthcare`, `roads`, `education`, `electricity`, `sanitation`, `digital_connectivity`, `agriculture`, `housing`, `public_safety`, `other`) and 8 non-sensitive cohorts (`students`, `elderly`, `women`, `farmers`, `children`, `workers`, `patients`, `general_population`).
- **Vertex AI Multilingual Vector Embeddings:** 768-dimensional dense vector embeddings generated with unit-length L2 normalization. Shared domain subspaces ensure cross-lingual cosine similarity $\ge 0.70$ between Tamil, Hindi, Telugu, and English.
- **BigQuery Vector Search:** High-performance vector indexing with spatial (`geo_id`) and sectoral (`category`) pre-filtering and a centralized similarity threshold ($0.72$).
- **Semantic Demand Clustering:** Clusters requests sharing the *same* `geo_id` and *same* `category` using deterministic identifiers (`CLS-{CAT}-{GEO}-{HASH}`). Tracks actual member requests and true submission counts (never fabricated figures).
- **Mandatory Policy Caution:** Every AI perception output and UI surface includes the prominent disclaimer: *"AI-Derived Interpretation — Not Official Policy"*.

### 2. Phase 4 REST API Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/process/{request_id}` | Runs full AI perception pipeline: Gemini extraction → 768-D embedding → vector search → demand clustering → Pub/Sub broadcast. | `application/json` |
| `GET` | `/api/v1/ai/status/{request_id}` | Retrieves AI extraction parameters, embedding status, and cluster assignment. | `application/json` |
| `GET` | `/api/v1/ai/clusters` | Lists synthesized semantic demand clusters with spatial (`geo_id`) and sector (`category`) filtering. | `application/json` |
| `GET` | `/api/v1/ai/clusters/{cluster_id}` | Retrieves full cluster metadata, representative issue, and actual member request IDs. | `application/json` |
| `GET` | `/api/v1/ai/similar/{request_id}` | Executes BigQuery Vector Search finding semantically related community complaints. | `application/json` |
| `GET` | `/api/v1/ai/taxonomy` | Returns the complete controlled JANSETU civic taxonomy of categories, subcategories, and cohorts. | `application/json` |

### 3. Frontend AI Perception View (`AIPerceptionView.tsx`)
A dedicated frontend UI component integrated into the JANSETU sovereign command console:
- **Prominent Civic Disclaimer:** Clear yellow/amber caution banner: *"AI-Derived Interpretation — Not Official Policy"*.
- **Interactive Pipeline Runner:** Execute AI perception on any existing citizen request ID with quick-sample buttons (Harur bus service, PHC doctor shortage, Kaveripattinam water crisis).
- **Structured Perception Card:** Visualizes primary sector, subcategory, demographic cohort, authoritative `geo_id`, 5-level severity meter, urgency progress bar, extracted infrastructure gap, actionable summary, and model provenance.
- **Vertex AI Embedding Card:** Displays strict 768-D confirmation, cross-lingual subspace signature, BigQuery vector engine persistence, and an interactive 48-dimension vector spectrum heatmap.
- **Demand Clusters Explorer:** Live sectoral filtering, true report counts, average severity, and representative issues.
- **Vector Search Similarity Results:** Live display of related citizen requests exceeding the 0.72 cosine similarity threshold with match percentages.
