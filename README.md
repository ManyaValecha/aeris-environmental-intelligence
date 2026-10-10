<div align="center">

# 🌫️ AERIS
### AI Environmental Response & Intelligence System
#### Atmospheric Digital Twin · Delhi NCR Air Quality Command Centre

<br/>

[![Live App](https://img.shields.io/badge/🌐_Live_App-aeris--environmental--intelligence.vercel.app-10b981?style=for-the-badge)](https://aeris-environmental-intelligence.vercel.app)

<br/>

[![Build](https://img.shields.io/badge/Build-Passing-22c55e?style=flat-square&logo=github-actions)](https://aeris-environmental-intelligence.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-117%2F117_Passing-22c55e?style=flat-square&logo=vitest)](https://github.com/ManyaValecha/aeris-environmental-intelligence)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![AWS CDK](https://img.shields.io/badge/AWS_CDK-v2-ff9900?style=flat-square&logo=amazon-aws)](https://aws.amazon.com/cdk/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel)](https://aeris-environmental-intelligence.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-a855f7?style=flat-square)](LICENSE)

<br/>

> **Delhi NCR experiences some of the world's worst air quality events. Existing tools show pollution numbers — AERIS shows what to do about it.**

</div>

---

## ⚡ What is AERIS?

**AERIS** (AI Environmental Response & Intelligence System) is a real-time, ML-powered environmental intelligence platform and atmospheric digital twin for the Delhi NCR region. It transforms raw air-quality telemetry into a continuous four-stage decision workflow:

```
🔭 OBSERVE  →  🧠 UNDERSTAND  →  🔮 PREDICT  →  🎛️ INTERVENE
```

Unlike conventional dashboards that display static AQI numbers, AERIS:

- **Detects anomalies** automatically using MAD (Median Absolute Deviation) statistics across all 8 CPCB monitoring stations
- **Forecasts pollution** at three scientifically-distinct time horizons using dedicated ML models (XGBoost, LSTM, Prophet)
- **Simulates policy levers** — traffic curbs, construction bans, industrial shutdowns — and shows the estimated PM2.5 impact with honest uncertainty bounds
- **Briefs decision-makers** in plain language via an Amazon Bedrock–powered Environmental Copilot, grounded strictly in validated data

The result: a scientific-grade decision-support tool for public health officials and citizens during Delhi's catastrophic winter smog episodes.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AERIS — AWS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DATA SOURCES                                                           │
│  ┌──────────────────┐   MQTT    ┌────────────────────────────────────┐  │
│  │ CPCB Stations ×8 │ ───────▶  │ AWS IoT Core                       │  │
│  │ (PM2.5, NO2, O3) │           │ topic: aeris/stations/+/telemetry  │  │
│  └──────────────────┘           └────────────────┬───────────────────┘  │
│  ┌──────────────────┐                            │ trigger              │
│  │ ERA5 Reanalysis  │           ┌────────────────▼───────────────────┐  │
│  │ (Meteorology)    │ ───────▶  │ Lambda: aeris-ingestion-handler    │  │
│  └──────────────────┘           │ • Schema + range validation        │  │
│                                 │ • Provenance preservation          │  │
│  ┌──────────────────┐           │ • SIMULATED label guard            │  │
│  │ EventBridge Rule │ ───────▶  └────────────────┬───────────────────┘  │
│  │ (15-min demo)    │                            │ write                │
│  └──────────────────┘           ┌────────────────▼───────────────────┐  │
│                                 │ DynamoDB: AerisTelemetry            │  │
│  ML ARTIFACTS                   │ PK=STATION#{id} SK=TIMESTAMP#{iso} │  │
│  ┌──────────────────┐           └────────────────┬───────────────────┘  │
│  │ S3: aeris-model- │ ◀─────── │ Lambda: aeris-api-handler          │  │
│  │ artifacts        │           │ GET /stations                      │  │
│  │ (private, SSE)   │           │ GET /stations/{id}/latest          │  │
│  └──────────────────┘           │ POST /telemetry                    │  │
│                                 └────────────────┬───────────────────┘  │
│  AI REASONING                                    │ REST/HTTPS           │
│  ┌──────────────────┐           ┌────────────────▼───────────────────┐  │
│  │ Amazon Bedrock   │ ◀──────── │ AWSDataProvider (→ Demo fallback)  │  │
│  │ Claude 3.5 Sonnet│  grounded │                                    │  │
│  │ / Haiku          │  context  └────────────────┬───────────────────┘  │
│  └──────────────────┘                            │                      │
│                                 ┌────────────────▼───────────────────┐  │
│                                 │ React Dashboard (Vercel Edge CDN)  │  │
│                                 │ • Atmospheric Digital Twin HUD     │  │
│                                 │ • 4-Horizon Forecast Scrubber      │  │
│                                 │ • Policy Intervention Simulator    │  │
│                                 │ • Environmental Copilot            │  │
│                                 └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Feature Deep-Dives

### 🌌 1. Atmospheric Boundary Layer Digital Twin HUD

A live scientific read-out of the Delhi NCR atmosphere — not just AQI numbers:

| Indicator | Source | What it means |
|---|---|---|
| **PBL Mixing Height** (m AGL) | ERA5 reanalysis + station temp | How deep the atmospheric "lid" is — lower = more trapped pollution |
| **Thermal Inversion Status** | Δ surface / 850 hPa temperature | Inversion layers are the #1 cause of smog episodes |
| **Wind Vector Heading** | Station anemometer | Identifies upwind emission source regions |
| **Vertical Dispersion Index** | PBL × wind × humidity composite | Atmosphere's current self-cleaning capacity |

An animated particle streamline canvas visualises real-time wind flow, aligned with the active station's wind vector.

---

### 🗺️ 2. Delhi NCR Spatial Monitoring Matrix

8 CPCB reference monitoring stations on an interactive Leaflet map with a 30 km NCR boundary ring:

| Station | Coordinates | Dominant Source |
|---|---|---|
| Anand Vihar | 28.6463°N, 77.3152°E | Traffic corridor, road dust |
| ITO | 28.6289°N, 77.2401°E | Central traffic junction |
| RK Puram | 28.5645°N, 77.1890°E | Residential, light traffic |
| Dwarka | 28.5921°N, 77.0460°E | Industrial fringe |
| Punjabi Bagh | 28.6742°N, 77.1310°E | Mixed urban |
| Bawana | 28.7936°N, 77.0338°E | Heavy industrial cluster |
| Noida Sector 62 | 28.6270°N, 77.3710°E | IT corridor, vehicle density |
| Gurugram Vikas Sadan | 28.4595°N, 77.0266°E | Commercial district |

---

### ⏱️ 3. Four-Horizon Forecast Timeline Scrubber

Four scientifically-distinct forecasting modes, each with its own model, uncertainty, and honest labelling:

| Horizon | Model | R² | RMSE | Provenance Tag |
|---|---|---|---|---|
| **NOW** | CPCB Reference / ERA5 Reanalysis | — | — | `MEASURED` / `REANALYSIS` |
| **+1 HOUR** | XGBoost (gradient boosting, 24-feature) | 0.88 | 14.2 μg/m³ | `PREDICTED` |
| **+6 HOURS** | LSTM (convective boundary layer, 48-step) | 0.82 | 21.8 μg/m³ | `PREDICTED` |
| **+24 HOURS** | Prophet (long-range regional transport) | 0.74 | 34.5 μg/m³ | `PREDICTED` |

All forecast panels display:
- Empirical **uncertainty bounds: ±1.96 × RMSE** (95% coverage)
- Calibrated confidence level label per horizon
- Clear `PREDICTED` provenance badge — no false precision

---

### ✈️ 4. The Intervention Flight — Signature Workflow

A guided, six-stage interaction that takes a user from anomaly discovery to a real, contextualised policy recommendation:

```
① Identify anomaly station on the Delhi NCR spatial map
         ↓
② Inspect 30-day historical PM2.5 series + MAD-detected anomaly annotations
         ↓
③ Compare 1h / 6h / 24h ML forecasts with uncertainty bands side-by-side
         ↓
④ Adjust traffic / construction / industrial intervention sliders
         ↓
⑤ View estimated PM2.5 reduction + AQI category improvement  [ESTIMATED]
         ↓
⑥ Read Environmental Copilot AI briefing — grounded in the above context
```

This is the core user journey for the demo, and the primary differentiator from static AQI apps.

---

### 🎛️ 5. Policy Sensitivity Simulator

Simulate the real-world impact of three categories of Delhi's proven emission-reduction interventions:

| Control | Source Contribution Basis | PM2.5 Contribution Range |
|---|---|---|
| 🚗 Traffic Combustion Reduction | CPCB source apportionment upper bound | up to ~30% |
| 🏗️ Construction Dust Suppression | SAFAR source apportionment upper bound | up to ~18% |
| 🏭 Industrial / Waste-burning Curbs | CPCB source apportionment upper bound | up to ~22% |

**Design principle:** Results carry horizon attenuation factors (1h → 6h → 24h) and are labelled `ESTIMATED`, never `PREDICTED`. This is a sensitivity scenario tool, not a causal model.

---

### 🤖 6. Amazon Bedrock Environmental Copilot

An AI briefing assistant generating grounded, contextual environmental intelligence:

- **Two modes:** Citizen (accessible language) and Authority (technical, action-oriented)
- **Strictly grounded:** Every brief is constructed from validated application context — no hallucinated measurements
- **Provenance-safe:** All Bedrock responses tagged `AI-GENERATED`, visually separated from instrument readings
- **Prompt architecture:** Explicitly prohibits the LLM from inventing a single numerical measurement or forecast

---

## 🔒 Security & AWS Best Practices

| Control | Implementation |
|---|---|
| **Least-Privilege IAM** | `bedrock:InvokeModel` scoped strictly to `arn:aws:bedrock:${region}::foundation-model/*` |
| **S3 Hardening** | `BlockPublicAccess.BLOCK_ALL`, S3-managed encryption, `enforceSSL: true`, 90-day lifecycle |
| **DynamoDB Encryption** | AWS-managed SSE + Point-in-Time Recovery enabled |
| **Zero Hardcoded Secrets** | Automated `securityCheck.test.ts` verifies zero credentials in the client bundle |
| **Lambda Input Validation** | ISO 8601 timestamp, station registry whitelist, physical PM2.5 range guards |
| **CORS** | Configured at API Gateway level, not open-wildcard |

---

## 🏷️ Data Provenance Taxonomy

AERIS enforces a strict six-category provenance system. Every data point carries a label that is **preserved end-to-end** — never silently converted by the pipeline.

| Badge | Tag | Category | Source |
|---|---|---|---|
| 🟢 | `MEASURED` | Sensor Ground Truth | Direct instrument readings from CPCB reference stations |
| 🔵 | `REANALYSIS` | Meteorological Grid | ERA5 hourly surface atmospheric reanalysis fields |
| 🟡 | `SIMULATED` | Demo / Scheduled | Deterministic offline seed data + EventBridge 15-min triggers |
| 🟣 | `PREDICTED` | ML Forecast | XGBoost / LSTM / Prophet model outputs |
| 🟠 | `ESTIMATED` | Scenario Output | Policy sensitivity simulator calculations |
| ⚪ | `AI-GENERATED` | LLM Briefing | Amazon Bedrock natural-language synthesis |

> **Guarantee:** The ingestion Lambda explicitly preserves provenance and will never convert a `SIMULATED` record to `MEASURED`. Tested in `ingestValidation.test.ts`.

---

## 🔬 Scientific Disclaimer

AERIS is an environmental intelligence **decision-support tool**, not a certified CPCB monitoring station.

- **Forecast uncertainty** is empirical (based on model RMSE on held-out test data), not theoretical.
- **Scenario sensitivity estimates** use published CPCB/SAFAR source apportionment *upper bounds* and are labelled `ESTIMATED`.
- **Amazon Bedrock** is used exclusively for natural-language synthesis — it is **not** the numerical forecasting engine.
- Real atmospheric response depends on meteorology, secondary aerosol formation, long-range transport, and local topography not captured in this tool.

---

## 📁 Project Structure

```
aeris-environmental-intelligence/
│
├── infra/                              # AWS CDK v2 Infrastructure as Code
│   ├── bin/infra.ts                    # CDK app entrypoint
│   ├── lib/aeris-stack.ts              # Complete AWS stack
│   │   ├── DynamoDB (AerisTelemetry, SSE, PITR)
│   │   ├── S3 (model artifacts, private, encrypted)
│   │   ├── Lambda (ingestion guard + API handler)
│   │   ├── API Gateway (REST, CORS)
│   │   ├── EventBridge (15-min SIMULATED demo schedule)
│   │   └── IAM (least-privilege roles)
│   ├── lambda/
│   │   ├── ingest.ts                   # Ingestion: validate → persist
│   │   └── api.ts                      # REST proxy handler
│   └── test/aeris-stack.test.ts        # 7 CDK infrastructure assertions
│
├── src/
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── IntelligencePanel.tsx      # Station intelligence + anomalies
│   │   │   ├── ForecastTimelineScrubber.tsx # 4-horizon selector
│   │   │   ├── ScenarioSimulator.tsx       # Policy intervention sliders
│   │   │   ├── ComparisonVisualization.tsx # Before/after AQI comparison
│   │   │   ├── EnvironmentalCopilot.tsx    # Bedrock AI copilot
│   │   │   └── AWSArchitectureModal.tsx    # Architecture explainer modal
│   │   ├── common/
│   │   │   ├── AtmosphericCanvas.tsx      # Animated particle streamlines
│   │   │   ├── DigitalTwinHUD.tsx         # PBL / inversion / wind HUD
│   │   │   └── ProvenanceBadge.tsx        # Colour-coded data labels
│   │   ├── layout/
│   │   │   └── CommandHeader.tsx          # IST live clock + system status
│   │   ├── map/
│   │   │   └── StationMap.tsx             # Leaflet spatial map
│   │   └── stations/
│   │       ├── StationCard.tsx            # Station telemetry card
│   │       └── StationGrid.tsx            # 8-station monitor grid
│   │
│   ├── data/
│   │   ├── demoDataGenerator.ts           # Deterministic offline demo data
│   │   └── stations.ts                    # CPCB station registry
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── dataProvider.ts            # Provider interface
│   │   │   ├── awsDataProvider.ts         # Live AWS REST client
│   │   │   └── demoDataProvider.ts        # Offline demo fallback
│   │   ├── copilot/
│   │   │   ├── bedrockAdapter.ts          # Amazon Bedrock invoke wrapper
│   │   │   └── contextBuilder.ts          # Grounded context constructor
│   │   ├── anomalyService.ts              # MAD anomaly detection
│   │   ├── forecastService.ts             # XGBoost / LSTM / Prophet
│   │   ├── historicalService.ts           # 30-day series builder
│   │   └── interventionService.ts         # CPCB scenario simulator
│   │
│   ├── store/aerisStore.ts               # Zustand global state
│   ├── tests/                            # 117 Vitest unit & integration tests
│   ├── types/                            # TypeScript interfaces
│   ├── App.tsx                           # Command Dashboard layout
│   ├── index.css                         # Design system + tokens
│   └── main.tsx                          # React 18 entrypoint
│
├── index.html                            # HTML5 + Google Fonts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites

- **Node.js** ≥ 20.x  
- **npm** ≥ 10.x  
- (Optional) AWS CLI + credentials for live AWS backend

### Install & Run

```bash
# 1. Clone
git clone https://github.com/ManyaValecha/aeris-environmental-intelligence.git
cd aeris-environmental-intelligence

# 2. Install
npm install

# 3. Run dev server
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**

> The app runs fully in **offline demo mode** with no AWS credentials required. Every feature works, all data labelled `SIMULATED`.

---

## 🧪 Test Suite

```bash
# All 117 tests
npm test

# TypeScript type check
npm run typecheck

# Production build
npm run build
```

**Test coverage by module:**

| Test Suite | Tests | Coverage |
|---|---|---|
| `aqiCalculator.test.ts` | 25 | AQI category, colour, health message accuracy |
| `dataProvenance.test.ts` | 21 | End-to-end provenance tag preservation |
| `interventionService.test.ts` | 11 | Scenario deltas, provenance, boundary conditions |
| `formatters.test.ts` | 11 | Output formatting functions |
| `ingestValidation.test.ts` | 7 | Lambda validation + SIMULATED label guard |
| `aeris-stack.test.ts` | 7 | CDK infrastructure assertions |
| `dataPipeline.test.ts` | 6 | Data pipeline transformations |
| `awsIntegrationDemonstration.test.ts` | 4 | AWS integration demonstration |
| `forecastService.test.ts` | 4 | Forecast horizon dispatch + uncertainty |
| `interventionFlight.test.ts` | 5 | End-to-end intervention workflow |
| `awsDataProvider.test.ts` | 3 | AWS → Demo fallback logic |
| `anomalyService.test.ts` | 3 | MAD detection algorithm |
| `copilotService.test.ts` | 3 | Bedrock grounding validation |
| `digitalTwin.test.ts` | 3 | Digital twin calculations |
| `securityCheck.test.ts` | 2 | Zero-credentials in client bundle |
| `historicalService.test.ts` | 2 | Historical series construction |
| **Total** | **117** | **All passing ✅** |

---

## ☁️ AWS Infrastructure

### Synthesize CloudFormation Template (Free / Local)

```bash
cd infra
npm install
npx cdk synth
```

Generates a complete CloudFormation template with **zero AWS API calls** — safe anywhere.

### Deploy to AWS

```bash
# Authenticate
aws sso login
# — or —
aws configure

# Deploy
cd infra
npx cdk deploy AerisStack --require-approval broadening
```

**Cost estimate:** Lambda + DynamoDB + S3 usage within AWS Free Tier for development. Amazon Bedrock charged per token — see [AWS Bedrock pricing](https://aws.amazon.com/bedrock/pricing/).

---

## 🌐 Deployment

**Live production app:** [aeris-environmental-intelligence.vercel.app](https://aeris-environmental-intelligence.vercel.app)

The frontend deploys automatically on every `main` push via Vercel's GitHub integration.

```bash
# Manual deploy
npx vercel --prod --yes
```

**Environment variables** (optional — set in Vercel dashboard):

| Variable | Purpose | Without it |
|---|---|---|
| `VITE_AWS_API_BASE_URL` | API Gateway invoke URL | Falls back to demo mode |
| `VITE_AWS_REGION` | AWS region | Falls back to demo mode |
| `VITE_BEDROCK_MODEL_ID` | Bedrock model ID | Copilot uses demo response |

---

## 🏆 Why AERIS Stands Out

| Criterion | Implementation |
|---|---|
| **Real-world impact** | Delhi NCR winter smog — >20 million people directly affected |
| **AWS breadth** | CDK v2, Lambda, DynamoDB, S3, API Gateway, EventBridge, Bedrock, IoT Core |
| **AI/ML depth** | Three dedicated ML models (XGBoost, LSTM, Prophet) + LLM via Bedrock |
| **Scientific rigour** | Honest uncertainty bounds, 6-tag provenance taxonomy, source-apportionment citations |
| **Engineering quality** | 117 passing tests, zero TypeScript errors, automated security audit |
| **UX design** | Cinematic mission-control HUD, animated atmospheric canvas, responsive layout |
| **Accessibility** | Semantic HTML, WCAG contrast ratios, keyboard navigation |
| **Offline resilience** | Full demo mode — no AWS credentials required for every feature |

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes.

```bash
# Fork, then:
git checkout -b feat/your-feature
npm test && npm run typecheck
# Submit PR
```

---

## 📜 License

Open source under the **[MIT License](LICENSE)**.

---

<div align="center">

**Built for Delhi. Powered by AWS. Open to the world.**

[🌐 Live App](https://aeris-environmental-intelligence.vercel.app) · [💻 GitHub](https://github.com/ManyaValecha/aeris-environmental-intelligence) · [🐛 Report Issue](https://github.com/ManyaValecha/aeris-environmental-intelligence/issues)

<br/>

*AERIS — Because air quality isn't a number. It's a decision.*

</div>
