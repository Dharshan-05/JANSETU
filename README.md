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

---

## Phase 5: Demand Hotspots & Demand Shadow Engine

### 1. Architectural Architecture & Intelligence Layers
Phase 5 implements the **DISCOVER** and **SHADOW** intelligence layers of JANSETU:
1. **Demand Aggregation Engine (`DemandAggregationService`):**
   - Synthesizes raw citizen requests and semantic clusters into deterministic geographic demand summaries across administrative levels (District, Block, Ward).
   - **Citizen Voice Intensity Formulation:**
     $$V_{\text{voice}}(g, t) = \min\left( \frac{\text{RequestCount}(g, t)}{\text{Population}(g)} \times \frac{1000}{5.0}, 1.0 \right)$$
     Safely handles zero population and unpopulated rural sectors without division-by-zero errors.
   - **Demand Velocity & Trend Tracking:**
     $$\text{Velocity} = \frac{\text{Count}_{\text{current}} - \text{Count}_{\text{previous}}}{\text{Count}_{\text{previous}}}$$
     Explicitly classifies zero baselines into `NEW_DEMAND` and `INSUFFICIENT_DATA`, preventing numerical infinity. Categorizes growth into `RAPIDLY_INCREASING`, `INCREASING`, `STABLE`, or `DECREASING`.
   - **Category Demand Concentration:** Computes sector-specific concentration ratios against total localized volume.

2. **Deterministic Hotspot Detection Engine (`HotspotDetectionService`):**
   - Calculates a normalized, multi-factor deterministic hotspot score:
     $$\text{Score} = 0.40 \cdot C_{\text{voice}} + 0.25 \cdot C_{\text{exposure}} + 0.20 \cdot C_{\text{velocity}} + 0.15 \cdot C_{\text{concentration}}$$
   - Priority Tier Classification:
     - $\ge 0.70 \to$ `CRITICAL`
     - $\ge 0.45 \to$ `HIGH`
     - $\ge 0.20 \to$ `MODERATE`
     - $< 0.20 \to$ `MONITORING`
   - **Deterministic Identifiers:** Generates repeatable IDs formatted as `HOT-{CAT}-{GEO}-{HASH}` where the hash is computed from `(geo_id, category, window_days, version)`.
   - **Component-Level Explainability:** Every hotspot provides transparent breakdown of all 4 scoring components and plain-English synthesis.

3. **Demand Shadow 2D Matrix Engine (`DemandShadowService`):**
   - Correlates citizen reporting volume (Axis X: $V_{\text{voice}}$) against audited public infrastructure deficit (Axis Y: $I_{\text{need}}$).
   - Mathematical Discrepancy: $D(g) = I_{\text{need}} - V_{\text{voice}}$.
   - **4 Neutral Analytical Quadrants:**
     - **Quadrant 1 ($V \ge 0.40, I \ge 0.50$):** `HIGH_VOICE_HIGH_NEED` — Demand Hotspot. High civic demand corroborating high infrastructure deficit.
     - **Quadrant 2 ($V < 0.40, I \ge 0.50$):** `LOW_VOICE_HIGH_NEED` — Potential Demand-Need Discrepancy. High infrastructure deficit with lower citizen reporting volume. *(Potential Silent-Need Candidate Quadrant — Not a Silent Need determination. Requires further administrative validation).*
     - **Quadrant 3 ($V \ge 0.40, I < 0.50$):** `HIGH_VOICE_LOW_NEED` — Expressed Demand / Lower Baseline Deficit. High civic reporting volume despite lower measured baseline deficit.
     - **Quadrant 4 ($V < 0.40, I < 0.50$):** `LOW_VOICE_LOW_NEED` — Low Current Signal. Low reporting volume and lower measured deficit.
   - **Mandatory Policy Disclaimer:** Every analytical response and UI display contains: `"AI-Derived Analytical Signal — Not Official Policy"`.

### 2. Phase 5 REST API Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/hotspots` | Lists demand hotspots with filters (`category`, `hotspot_level`, `state_code`, `district`, `min_score`). | `application/json` |
| `GET` | `/api/v1/hotspots/summary` | Command Center telemetry: total hotspots, priority breakdown, category distribution, and version. | `application/json` |
| `GET` | `/api/v1/hotspots/{hotspot_id}` | Full deterministic score breakdown and component-level explainability for a specific hotspot. | `application/json` |
| `GET` | `/api/v1/demand-shadow` | Dedicated 2D Demand Shadow Matrix endpoint with axis scores, quadrants, discrepancy, and filters. | `application/json` |
| `GET` | `/api/v1/analytics/demand-shadow` | Legacy analytical demand shadow grid endpoint (fully preserved for backward compatibility). | `application/json` |

### 3. Frontend Visualizations
- **`HotspotsView.tsx`:** Enhanced with deterministic score badges, level filters (Critical, High, Moderate), sector filters, and an interactive **Explain Analytical Signal** modal detailing all 4 components ($V_{\text{voice}}$, population exposure, velocity, sector concentration).
- **`DemandShadowMap.tsx`:** Interactive 2D scatter matrix mapping $V_{\text{voice}}$ vs $I_{\text{need}}$, color-coded across all 4 neutral quadrants, dynamic sector/state/quadrant filtering, and deep-dive zone discrepancy profiles with public dataset attribution.

---

## Phase 6: Potential Silent Need Detection & Gap Intelligence Engine

### 1. Architectural Architecture & Intelligence Layers
Phase 6 implements the **GAP INTELLIGENCE** layer of JANSETU, synthesizing multi-sector infrastructure deficit, demographic vulnerability, and digital connectivity exclusion to identify geographic areas where severe public service gaps are obscured by low citizen reporting volume.

1. **Deterministic Need Score Formulation:**
   $$I_{\text{need}}(g, c) = 0.55 \cdot \text{InfraDeficit}(g, c) + 0.35 \cdot \text{VulnerabilityScore}(g) + 0.10$$
   - Combines audited infrastructure indicators with demographic vulnerability and a 10% baseline floor.
   - Strictly bounded and normalized to $[0.0, 1.0]$.

2. **Citizen Voice Signal Reuse:**
   - Consumes the exact Phase 5 deterministic citizen voice intensity $V_{\text{voice}}(g, t)$ to maintain single source of truth across intelligence layers.

3. **Mathematical Discrepancy Formulation:**
   $$\text{Discrepancy}(g, c) = I_{\text{need}}(g, c) - V_{\text{voice}}(g, c)$$
   - Positive discrepancy: Modeled infrastructure need exceeds expressed citizen complaints $\to$ potential gap.
   - Negative discrepancy: Expressed civic demand exceeds baseline need (not "no need").

4. **Triangulated Signal Trigger Rule:**
   A **Potential Silent Need Signal** is generated if and only if all three conditions are satisfied:
   $$\text{Discrepancy} \ge 0.35 \quad \text{AND} \quad \text{InfraDeficit} \ge 0.60 \quad \text{AND} \quad \text{DigitalAccess} \le 0.40$$

5. **Analytical Signal Strength & Classification:**
   $$\text{signal\_strength} = 0.50 \cdot \text{Discrepancy}_{\text{norm}} + 0.30 \cdot \text{InfraDeficit} + 0.20 \cdot (1 - \text{DigitalAccess})$$
   - $\ge 0.65 \to$ `STRONG_POTENTIAL` (Strong Potential Silent Need Signal)
   - $\ge 0.35 \to$ `POTENTIAL` (Potential Silent Need Signal)
   - $< 0.35 \to$ `NO_SIGNAL` (Monitoring Baseline)

6. **Deterministic Identifiers:**
   - Format: `SILENT-{CAT}-{GEO}-{HASH}`
   - Repeatable hash derived from `(geo_id, category, version)` without random or timestamp dependencies.

7. **Structured Explainability & Governance Guardrails:**
   - Every signal exposes transparent factor contributions across 4 dimensions: Infrastructure Deficit, Demographic Vulnerability, Citizen Voice Density, and Digital Connectivity Access.
   - **Mandatory Policy Disclaimers:**
     - `"AI-Derived Analytical Signal — Not Official Policy"`
     - `"Potential Silent Need Signal — requires administrative field validation."`

### 2. Phase 6 REST API Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/silent-need` | Lists potential silent need signals with multi-dimensional filtering (`category`, `state_code`, `signal_class`, `min_discrepancy`, `min_signal_strength`). | `application/json` |
| `GET` | `/api/v1/silent-need/summary` | Aggregated telemetry: total monitored, potential signals, strong potential counts, and category/state distributions. | `application/json` |
| `GET` | `/api/v1/silent-need/{signal_id}` | Full deterministic factor breakdown, driver contributions, investment context, and audit provenance. | `application/json` |
| `POST` | `/api/v1/silent-need/evaluate/{geo_id}` | Real-time mathematical triangulation evaluation for a specific Census LGD or Geo ID. | `application/json` |

### 3. Frontend Visualizations (`SilentNeedView.tsx`)
- **Investigation Room Workspace:** Transforms from a passive list into a rich civic analytical case room.
- **Visual Signature: Need vs Voice Gap Card:** Directly illustrates the mathematical gap between citizen voice density and modeled infrastructure need.
- **Factor Progress Bars:** Visualizes the 4 underlying drivers with explicit trigger threshold markers.
- **Fact Summary & Governance Notices:** Prominently highlights validation requirements without speculative or prescriptive narrative.

---

## Phase 7: Grounded Evidence Engine

### 1. Architectural Architecture & Intelligence Layers
Phase 7 implements the **GROUNDED EXPLANATION** layer of JANSETU, answering the critical governance question: **“WHY WAS THIS REGION FLAGGED?”** using exclusively retrieved, atomic, and attributable evidence records.

```
RETRIEVE → VERIFY → STRUCTURE → CITE → SYNTHESIZE
```

1. **Atomic Evidence Records (`EvidenceRecord`):**
   - Each record represents one atomic factual observation (e.g., tap water coverage rate, distance to emergency PHC, aggregated citizen complaints over 14 days), never an ungrounded interpretation.
   - Deterministic identifier scheme: `EV-{SIG_HASH}-{FACTOR}-{INDEX}` (e.g. `EV-5127A0-INF-01`).

2. **Hierarchical Source Provenance:**
   - **Tier 1 (Official Government):** Census of India, SECC, LGD, PMGSY, Jal Jeevan Mission, HMIS Rural Health Statistics (`is_official=True`, `source_tier=1`, `status=VERIFIED`).
   - **Tier 2 (Official Institutional):** TRAI telecom subscription data, ISRO/Bhuvan, IMD (`is_official=True`, `source_tier=2`, `status=VERIFIED`).
   - **Tier 3 (JANSETU Analytical):** Aggregated citizen requests, demand clusters, hotspots, silent need signals (`is_official=False`, `source_tier=3`, `status=ANALYTICAL`).
   - **Tier 4 (Synthetic Demo Data):** Prominently labeled `SYNTHETIC` with `⚠ SYNTHETIC DATA` warnings (`source_tier=4`, `status=SYNTHETIC`).

3. **Zero-Hallucination Gemini Contract (`EvidenceSynthesisService`):**
   - **Prompt Version:** `EVIDENCE_PROMPT_VERSION = "v7.0-grounded"`.
   - **Grounding Rule:** Gemini receives only targeted, retrieved BigQuery records and structured signal metadata.
   - **Strict JSON Contract:** Validated via Pydantic `GroundedSynthesisOutput` containing summary, claims citing evidence IDs, and data limitations.
   - **Claim Validator (`EvidenceClaimValidator`):** Rejects any generated statement citing missing, empty, or unknown evidence IDs.

4. **Evidence Coverage & Neutral Quality Scores:**
   - **Evidence Coverage:** $\text{coverage} = \frac{\text{supported\_required\_factors}}{\text{total\_required\_factors}}$ across 4 core drivers (Infrastructure Deficit, Vulnerability, Citizen Voice, Digital Access).
   - **Neutral Quality Labels:** `COMPLETE` ($4/4$ factors verified), `PARTIAL` ($3/4$), `LIMITED` ($2/4$), `INSUFFICIENT` ($<2/4$).
   - Never converted into a predictive probability or policy score.

5. **Conflicting & Missing Evidence Preservation:**
   - Discrepancies between official sources are preserved as `CONFLICTING_EVIDENCE` records without arbitrary overrides.
   - Unavailable indicators are explicitly surfaced as metadata-backed limitations (e.g. *"Block-level cellular telemetry is unavailable; district-level index applied"*).

6. **Privacy & Governance Guardrails:**
   - Citizen complaints remain aggregated without PII, personal names, phone numbers, or raw audio.
   - **Mandatory Disclaimers:**
     - `"AI-Derived Analytical Signal — Not Official Policy"`
     - `"Potential Silent Need Signal — requires administrative field validation."`

### 2. Phase 7 REST API Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/evidence/{signal_id}` | Full grounded evidence brief: 4 driver cards, atomic evidence records, validated claims, coverage, limitations, and prompt version. | `application/json` |
| `POST` | `/api/v1/evidence/{signal_id}/refresh` | Re-retrieves latest evidence and re-runs synthesis without altering the underlying Phase 6 intelligence score. | `application/json` |
| `GET` | `/api/v1/evidence/record/{evidence_id}` | Retrieves single atomic factual observation record with source date, dataset ID, and provenance status. | `application/json` |
| `GET` | `/api/v1/evidence/summary` | Evidence warehouse telemetry: total records, official vs analytical counts, and verified coverage percentage. | `application/json` |

### 3. Frontend Visualizations (`EvidenceModal.tsx`)
- **Signal Header & Mathematical Trigger Bar:** Visualizes Need Score, Voice Density, Discrepancy ($+D$), Deficit, and Digital Access alongside mandatory policy disclaimers.
- **Driver -> Evidence Cards:** 4 primary cards with live source provenance, observation year, Evidence IDs, and freshness badges.
- **Visual Evidence Trail Hierarchy:** Interactive tree showing `SIGNAL ➔ FACTOR ➔ EVIDENCE ID ➔ SOURCE`.
- **Grounded AI Explanation:** Plain-English synthesis strictly referencing evidence chips (`Supported by: EV-xxx`).
- **Claim-to-Evidence Inspector:** Interactive cards highlighting each atomic factual claim and its verified source evidence IDs.
- **Data Limitations & Conflict Alerts:** Explicit boundaries and source discrepancies presented transparently.
- **Source Provenance Table:** Complete metadata ledger with dataset IDs and prominent `⚠ SYNTHETIC DATA` warnings.

---

## Phase 8: Policy Sandbox & Scenario Simulation Engine

### 1. Architectural Principles & Governance Rules
Phase 8 implements the **COUNTERFACTUAL SIMULATION** layer of JANSETU, answering the core administrative inquiry: **“What might happen if a hypothetical intervention were applied to this region?”** without ever answering or prescribing **“What policy should the government choose?”**.

```
SELECT SIGNAL ➔ DEFINE SCENARIO ➔ APPLY ASSUMPTIONS ➔ SIMULATE ➔ COMPARE ➔ EXPLAIN ➔ AUDIT
```

1. **Hard Governance Rule — Strict 3-Way Metric Separation:**
   - **`HISTORICAL_FACT` (Blue):** Data retrieved from Phase 2/5/6/7 with explicit `evidence_ids` (population, baseline deficit, vulnerability, digital access, active projects).
   - **`MODEL_ASSUMPTION` (Amber):** User-configured parameters (intervention type, coverage %, target population %, hypothetical budget, implementation horizon).
   - **`SCENARIO_ESTIMATE` (Green):** Calculated hypothetical outcomes produced exclusively via deterministic mathematical equations.

2. **100% Deterministic Mathematical Formulations:**
   - **Estimated Deficit:** $\text{EstimatedDeficit} = \max(0.0, \text{BaselineDeficit} \times (1.0 - \text{CoverageImprovement}))$
   - **Estimated Gap Reduction:** $\text{EstimatedGapReduction} = \text{BaselineDeficit} - \text{EstimatedDeficit}$
   - **Estimated Gap Reduction Percentage:** $\text{EstimatedGapReductionPct} = \frac{\text{EstimatedGapReduction}}{\text{BaselineDeficit}} \times 100\%$
   - **Estimated Affected Population:** $\text{AffectedPopulation} = \text{round}(\text{Population} \times \text{TargetPopRatio})$
   - **Sensitivity Bounds:** $[\text{Reduction} \times (1.0 - \text{margin}), \text{Reduction} \times (1.0 + \text{margin})]$ with $\pm 10\%$ confidence interval.
   - **Deterministic Identifier Structure:** `SCN-{GEO}-{CATEGORY}-{HASH}` computed from SHA-256 of parameters for idempotent reproducibility.

3. **Strict Cost & Budget Transparency:**
   - The engine **never** fabricates, hallucinates, or estimates project costs autonomously.
   - If the user provides a hypothetical budget, it is visibly marked: `MODEL ASSUMPTION — USER PROVIDED` with status `USER_PROVIDED_ASSUMPTION`.
   - If omitted, `cost_status` is explicitly set to `UNAVAILABLE`, and cost-per-beneficiary displays `UNAVAILABLE`.

4. **Grounded Gemini Explanation (`ScenarioExplanationService`):**
   - **Prompt Version:** `SCENARIO_PROMPT_VERSION = "v8.0-grounded-simulation"`.
   - Synthesizes an objective, natural-language explanation strictly referencing verified evidence IDs and deterministic scenario numbers.
   - Strictly prohibited from performing mathematical calculations, proposing new policies, or giving prescriptive directives ("The government should...").

5. **Neutral Multi-Scenario Trade-Off Matrix (`ScenarioComparisonService`):**
   - Evaluates 2 to 4 scenarios side-by-side in a structured comparison matrix.
   - Strict prohibition on declaring "winners", assigning rankings, or using badges like "Best Option" or "Recommended Strategy".
   - Explicitly contrasts trade-offs and surfaces unaddressed dimensions for each alternative.

6. **Mandatory Policy Disclaimers:**
   - `"⚠ HYPOTHETICAL SCENARIO — MODEL ESTIMATE, NOT OFFICIAL POLICY"`
   - `"AI-Derived Analytical Signal — Not Official Policy"`

### 2. Phase 8 REST API Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sandbox/simulate` | Executes deterministic counterfactual simulation; returns 3-card structured result with sensitivity range and limitations. | `application/json` |
| `GET` | `/api/v1/sandbox/scenarios` | Lists saved scenarios filtered by `geo_id`, `sector`, and archive status. | `application/json` |
| `GET` | `/api/v1/sandbox/scenarios/{scenario_id}` | Retrieves full scenario record including baseline facts, assumptions, and deterministic estimates. | `application/json` |
| `POST` | `/api/v1/sandbox/compare` | Compares 2 to 4 scenarios neutrally across categorized metrics without ranking or declaring winners. | `application/json` |
| `POST` | `/api/v1/sandbox/{scenario_id}/explain` | Grounded Gemini explanation citing verified evidence IDs and noting explicit model limitations. | `application/json` |
| `POST` | `/api/v1/sandbox/{scenario_id}/archive` | Soft-archives scenario from default listings while preserving audit trail in BigQuery. | `application/json` |

### 3. Frontend Visualizations (`PolicySandbox.tsx`)
- **Civic Policy Flight Simulator:** Comprehensive analytical cockpit with real-time parameter tweaking.
- **Scenario Parameter Studio:** Sliders for coverage improvement (0-100%) and target population (0-100%), controlled intervention taxonomy, and optional budget with `MODEL ASSUMPTION — USER PROVIDED` tagging.
- **Three-Card View:** Strict visual and structural separation between **Historical Baseline (Cyan/Blue)**, **Model Assumptions (Amber)**, and **Scenario Estimates (Emerald/Green)**.
- **Before/After Deficit Vector Comparison:** High-contrast progress bars visualizing baseline deficit vs counterfactual deficit.
- **Grounded AI Explanation Panel:** Synthesizes qualitative trade-offs with attributed evidence chips.
- **Neutral Comparison Mode:** Multi-scenario matrix highlighting tradeoffs and unaddressed dimensions with zero ranking bias.
- **Data Limitations & Caveats:** Transparently surfaces elasticity bounds, inflation exclusions, and field validation mandates.

---

## Phase 9: Closed-Loop Impact Measurement & Evaluation Engine

### 1. Architectural Principles & Closed-Loop Intelligence Cycle
Phase 9 completes the governance loop of JANSETU by providing empirical **POST-INTERVENTION OUTCOME EVALUATION**, answering the fundamental administrative question: **“What changed after an intervention, compared with the documented baseline?”** while rigorously avoiding prescriptive policy dictates or unsubstantiated causal claims.

```
CITIZEN DEMAND
      │
      ▼
DEMAND SIGNAL (Phase 4/5)
      │
      ▼
INFRASTRUCTURE GAP & SILENT NEED (Phase 5/6)
      │
      ▼
EVIDENCE BASELINE (Phase 7)
      │
      ▼
HYPOTHETICAL SCENARIO (Phase 8)
      │
      ▼
ACTUAL INTERVENTION IMPLEMENTATION
      │
      ▼
POST-INTERVENTION OBSERVATION (Audit/Field Data)
      │
      ▼
IMPACT MEASUREMENT (Deterministic Delta & Target Gap)
      │
      ▼
OUTCOME EVALUATION (Attribution & Confounder Analysis)
      │
      ▼
LEARNING & MODEL VALIDATION (Forecast Accuracy Telemetry)
```

### 2. Core Governance Principles

1. **Strict 5-Tier Information Separation:**
   - **`HISTORICAL_FACT` (Blue):** Documented pre-intervention baseline observations with frozen snapshot timestamps and immutable evidence references.
   - **`MODEL_ASSUMPTION` (Amber):** User-configured parameters or external modeling hypotheses.
   - **`SCENARIO_ESTIMATE` (Violet):** Calculated hypothetical projections from Phase 8 simulations (*explicitly marked: Never an observed outcome*).
   - **`OBSERVED_OUTCOME` (Cyan):** Real-world, post-intervention measurements collected from verified field surveys, departmental audits, or IoT sensors.
   - **`IMPACT_ESTIMATE` (Emerald):** Deterministic differences between observed outcomes and frozen baselines.

2. **Zero Automatic Causality Claims:**
   - Default evaluation methodology is strictly **`DESCRIPTIVE_BEFORE_AFTER`** with **`DESCRIPTIVE_ONLY`** attribution.
   - Prohibited phrasing: *"The project caused X% improvement."*
   - Strictly enforced phrasing: *"The observed indicator changed by X% between baseline and post-intervention measurement."*
   - Surfaces unmeasured external factors (`ECONOMIC_GROWTH`, `SEASONAL_WEATHER`, `CROSS_SCHEME_CONVERGENCE`, `MIGRATION`) to prevent over-attribution.

3. **Deterministic Mathematical Formulations:**
   - **Unit Safety:** Strictly enforces $u_{\text{baseline}} = u_{\text{observation}}$ before performing arithmetic.
   - **Temporal Order:** Rejects observations where $t_{\text{observation}} \le t_{\text{baseline}}$.
   - **Absolute Change:** $\Delta = o - b$
   - **Percentage Change:** $\Delta\% = \frac{o - b}{b} \times 100\%$ *(guarded against division-by-zero when $b = 0$)*
   - **Target Gap:** $\text{TargetGap} = o - t$
   - **Directionality Inversion:** Correctly evaluates civic improvements for `HIGHER_IS_BETTER` ($o > b$) vs `LOWER_IS_BETTER` ($o < b$, such as travel times, health facility distances, or deficit metrics).
   - **Scenario vs Actual Comparison:** Computes prediction difference ($o - s$) and relative error ($\frac{|o - s|}{s} \times 100\%$) against Phase 8 forecasts.

4. **Model Validation & Learning Telemetry:**
   - Aggregates system-wide **Directional Consistency Rate** ($\% \text{ forecasts matching actual direction}$) and **Mean Absolute Prediction Error (MAPE)** to evaluate and calibrate future Phase 8 simulations.

5. **Grounded Gemini Explanation (`ImpactExplanationService`):**
   - **Prompt Version:** `IMPACT_PROMPT_VERSION = "v9.0-grounded-impact"`.
   - Synthesizes descriptive factual summaries citing evidence IDs and field audit sources.
   - Strictly forbidden from calculating numbers, claiming single-cause attribution, or prescribing next steps.

6. **Mandatory Audit Disclaimers:**
   - `"OBSERVED OUTCOME — MEASURED DATA"`
   - `"IMPACT ESTIMATE — DERIVED FROM OBSERVED DATA"`
   - `"AI-Derived Analytical Signal — Not Official Policy"`
   - `"Phase 8 Scenario Estimate — Not an Observed Outcome"`

### 3. Phase 9 REST API Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/impact/indicators` | Retrieves controlled indicator catalog with standardized units and directionality. | `application/json` |
| `GET` | `/api/v1/impact/evaluations` | Lists evaluations filtered by `geo_id`, `sector`, `evaluation_type`, and `data_quality`. | `application/json` |
| `POST` | `/api/v1/impact/evaluations` | Freezes baseline snapshot and creates a new impact evaluation audit record. | `application/json` |
| `GET` | `/api/v1/impact/evaluations/{id}` | Retrieves full evaluation record with baseline, observation, calculation, and scenario comparison. | `application/json` |
| `POST` | `/api/v1/impact/evaluations/{id}/observations` | Validates and appends a verified field observation to an existing evaluation. | `application/json` |
| `POST` | `/api/v1/impact/evaluations/{id}/calculate` | Idempotently calculates deterministic impact delta, percentage change, and scenario discrepancy. | `application/json` |
| `POST` | `/api/v1/impact/evaluations/{id}/explain` | Generates grounded natural-language synthesis citing evidence IDs and audit sources. | `application/json` |
| `GET` | `/api/v1/impact/model-validation` | Returns system-wide forecast calibration telemetry (Directional Consistency & MAPE). | `application/json` |

### 4. Frontend Visualizations (`ImpactDashboard.tsx`)
- **Civic Impact Observatory:** High-density command surface tracking closed-loop governance outcomes.
- **Summary KPI Bar:** Real-time counters for Total Evaluations, Verified Observations, Evaluated Indicators, and Scenario Comparisons.
- **Three-Card Evaluation View:** Side-by-side comparison across **Historical Baseline (Cyan/Blue)**, **Post-Intervention Observation (Emerald)**, and **Calculated Outcome Delta (Green)**.
- **Impact Timeline:** 4-node audit lifecycle showing `BASELINE ➔ INTERVENTION ➔ OBSERVATION ➔ MEASURED OUTCOME`.
- **Scenario vs. Actual Difference Card:** Directly measures Phase 8 counterfactual forecasts against Phase 9 empirical realities with directional alignment badges.
- **Attribution & Confounder Ledger:** Displays explicit attribution constraints and tracks potential external drivers.
- **Grounded AI Explanation Panel:** Synthesizes qualitative insights with attributed evidence chips.
- **Forecast Calibration Telemetry Tab:** Displays system-wide MAPE and directional consistency to inform policy planners.
- **Record Field Observation Modal:** Form with unit verification, temporal bounds checking, and audit source tracking.

---

## Phase 10: Civic Intelligence Learning & Continuous Calibration Engine

### 1. Architectural Principles & Continuous Calibration Cycle
Phase 10 transforms validated Phase 9 empirical observations into a controlled, versioned learning layer that safely improves future models, answering the central question: **“What has JANSETU learned from previously observed civic outcomes, and how can that evidence safely improve future models?”** without ever autonomously deciding policy or altering production models silently.

```
CITIZEN SIGNAL (Phase 3/4)
      │
      ▼
EVIDENCE & BASELINE (Phase 5/6/7)
      │
      ▼
SCENARIO SIMULATION (Phase 8)
      │
      ▼
REAL-WORLD OUTCOME (Phase 9 Field Audits)
      │
      ▼
EVALUATION & INGESTION (Phase 10 LearningObservation)
      │
      ▼
VALIDATED LEARNING (Deterministic Calibration & Held-Out Validation)
      │
      ▼
VERSIONED CALIBRATION (ModelVersion & Parameter Vectors)
      │
      ▼
FUTURE MODEL (Optional Administrative Review & Controlled Activation)
```

### 2. Core Governance Principles

1. **Strict 4-Tier Conceptual Separation:**
   - **`OBSERVATION`:** Real-world field measurements and evaluation metrics (`LearningObservation`).
   - **`VALIDATED LEARNING`:** Patterns supported by a sufficient sample of historical observations ($\ge 10$ calibration samples, $\ge 8$ validation samples, directional consistency $\ge 0.70$, error $\le 0.25$).
   - **`CALIBRATION PARAMETER`:** Versioned numerical parameters derived from validated learning with strict parameter change limits ($\le 35\%$).
   - **`MODEL VERSION`:** Explicitly versioned, immutable analytical configurations (`ModelVersion`).

2. **Zero Autonomous Model Activation:**
   - No observation can directly or autonomously alter production weights or parameters.
   - Enforced 7-step lifecycle:
     ```
     OBSERVATION ➔ VALIDATION ➔ SUFFICIENT SAMPLE? ➔ LEARNING CANDIDATE ➔ ADMINISTRATIVE REVIEW ➔ CALIBRATION VERSION ➔ VALIDATION ➔ OPTIONAL ACTIVATION
     ```
   - Candidates require human review: explicit `POST /candidates/{id}/approve` and `POST /models/{version}/activate` before any model is moved to `ACTIVE`.
   - Comprehensive rollback support (`POST /models/{version}/rollback`) allows instant reversion to previous verified baselines.

3. **Immutable Historical Data:**
   - Core tables (`citizen_requests`, `infrastructure`, `demographics`, `investments`, `evidence_records`, `silent_need_signals`, `policy_scenarios`, `impact_metrics`) are never overwritten.
   - All learning candidate states, parameter diffs, validation metrics, and model versions are stored in dedicated BigQuery analytics tables:
     - `learning_candidates`
     - `model_versions`
     - `learning_audit_events`

4. **Strict Temporal Leakage Protection:**
   - Chronological dataset partitioning enforces $t_{\text{training\_end}} \le t_{\text{validation\_start}}$.
   - Future observations cannot leak into calibration training. Any out-of-order observation triggers a `TEMPORAL_LEAKAGE_DETECTED` validation error and is excluded from training.

5. **Pure Deterministic Mathematical Learning:**
   - Gemini/LLMs never calculate parameters, weights, loss functions, errors, or model ranks.
   - All calibration formulas are 100% deterministic:
     - **Effectiveness Factor:** $f_{\text{candidate}} = \text{clamp}\left(f_{\text{current}} \times \left(1.0 + \text{learning\_rate} \times \text{mean}(\text{actual} - \text{predicted})\right), 0.50, 1.50\right)$
     - **Weights:** Normalized to sum to $1.0$: $w_i = \frac{w_i}{\sum w_k}$
     - **Validation Metrics:** $\text{MAE} = \frac{1}{N}\sum |y - \hat{y}|$, $\text{MAPE} = \frac{1}{N}\sum \frac{|y - \hat{y}|}{y} \times 100\%$, $\text{Directional Consistency} = \frac{1}{N}\sum \mathbb{I}(\text{sign}(\Delta \hat{y}) = \text{sign}(\Delta y))$.

6. **Neutral Model Comparison:**
   - Zero ranking bias: Strictly reports `CURRENT MODEL`, `CANDIDATE MODEL`, and `VALIDATION RESULTS`.
   - Prohibited terms: "WINNER", "BEST MODEL", "OPTIMAL MODEL".

7. **Drift & Quality Monitoring:**
   - Telemetry tracks statistical mean shift ($> 20\%$) and variance shift ($> 25\%$) across evaluations, flagging `STABLE`, `WATCH`, `DRIFT_DETECTED`, or `INSUFFICIENT_DATA`.
   - Data quality monitoring computes verified, proxy, missing, and conflicting data percentages.

8. **Grounded Gemini Explanation (`LearningExplanationService`):**
   - **Prompt Version:** `LEARNING_PROMPT_VERSION = "v10.0-grounded-learning"`.
   - Synthesizes grounded qualitative explanations strictly citing evaluation IDs and audit sources without offering policy recommendations.

9. **Mandatory Governance Disclaimers:**
   - `"CALIBRATION CANDIDATE — NOT ACTIVE PRODUCTION MODEL"`
   - `"MODEL VERSION — REQUIRES ADMINISTRATIVE APPROVAL FOR ACTIVATION"`
   - `"AI-Derived Analytical Signal — Not Official Policy"`

### 3. Phase 10 REST API Endpoints

| Method | Endpoint | Description | Content-Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/learning/summary` | Returns learning telemetry: candidates, models, active versions, data quality breakdown, and drift status. | `application/json` |
| `GET` | `/api/v1/learning/candidates` | Lists learning candidates filtered by `model_family` and `status`. | `application/json` |
| `GET` | `/api/v1/learning/candidates/{id}` | Retrieves full candidate record including parameters, validation metrics, and audit trail. | `application/json` |
| `POST` | `/api/v1/learning/candidates/generate` | Ingests evaluations, enforces temporal split, and computes deterministic calibration parameters. | `application/json` |
| `POST` | `/api/v1/learning/candidates/{id}/validate` | Evaluates candidate against held-out validation set and compares against current baseline. | `application/json` |
| `POST` | `/api/v1/learning/candidates/{id}/approve` | Administrative review action approving candidate for model version registration. | `application/json` |
| `POST` | `/api/v1/learning/candidates/{id}/reject` | Administrative review action rejecting candidate with documented reason. | `application/json` |
| `GET` | `/api/v1/learning/models` | Lists all registered model versions across families (`SCENARIO_SIMULATION`, `HOTSPOT_DETECTION`, `SILENT_NEED_DETECTION`). | `application/json` |
| `POST` | `/api/v1/learning/models/{version}/activate` | Promotes model version to active production state with immutable audit logging. | `application/json` |
| `POST` | `/api/v1/learning/models/{version}/rollback` | Reverts active model to a previous verified version with administrative justification. | `application/json` |
| `POST` | `/api/v1/learning/candidates/{id}/explain` | Grounded Gemini explanation citing evaluated outcome IDs without policy recommendations. | `application/json` |
| `GET` | `/api/v1/learning/audit-events` | Retrieves append-only audit trail for all learning, validation, approval, and activation events. | `application/json` |

### 4. Frontend Visualizations (`LearningDashboard.tsx`)
- **🧠 Civic Intelligence Learning Lab:** High-density command surface for versioned civic model calibration.
- **Summary KPI Bar:** Displays Real-Time counts for Evaluated Outcomes, Calibration Candidates, Registered Models, and Drift Status (`STABLE`, `WATCH`, `DRIFT_DETECTED`).
- **Candidate Ledger & Inspector:** Filterable table of calibration candidates with status badges (`PENDING_VALIDATION`, `VALIDATED`, `APPROVED`, `REJECTED`, `ACTIVE`, `ROLLED_BACK`).
- **Held-Out Validation Performance Panel:** Side-by-side neutral comparison of **Current Model** vs **Candidate Model** Validation MAE, Directional Consistency, and Mean Signed Error.
- **Calibrated Parameter Vector Diff Table:** Granular parameter inspection comparing Baseline vs Candidate values, relative shift percentages, and safety bounds.
- **Grounded AI Explanation Panel:** Synthesizes qualitative learning rationale citing specific evaluation IDs (`EVAL-001`, `EVAL-002`) with zero policy speculation.
- **Model Version Ledger:** Comprehensive catalog of all historical and active model versions with one-click administrative activation and rollback controls.
- **Immutable Audit Event Timeline:** Chronological event feed documenting candidate generation, validation splits, administrative approvals, and activations.
- **Candidate Generation Modal:** Controlled interface for initiating deterministic calibration with temporal window controls and parameter family selection.





