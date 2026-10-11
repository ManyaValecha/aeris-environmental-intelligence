import React from 'react';
import { X, Cloud, ShieldCheck, Database, Cpu, Lock, CheckCircle2, Server } from 'lucide-react';

interface AWSArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AWSArchitectureModal: React.FC<AWSArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border-[4px] border-ink bg-paper p-6 sm:p-8 shadow-[14px_14px_0_var(--ink)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b-[3px] border-ink pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="brutal-sticker bg-sun text-ink -rotate-1">
                CLOUD INFRASTRUCTURE
              </span>
              <span className="font-mono text-xs font-black uppercase text-ink-soft">
                AWS CDK v2 · Serverless Production Stack
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl font-display">
              AERIS SYSTEM ARCHITECTURE &amp; CLOUD PIPELINE
            </h2>
          </div>

          <button
            onClick={onClose}
            className="border-[2px] border-ink bg-white p-2 hover:bg-danger hover:text-paper transition-colors shadow-[2px_2px_0_var(--ink)] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 stroke-[3]" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-6 space-y-6">
          <p className="text-xs text-ink-soft leading-relaxed">
            AERIS is provisioned with <strong>AWS CDK v2</strong> (Infrastructure-as-Code). It runs an end-to-end serverless data pipeline designed to ingest physical CPCB station readings, run multi-horizon ML models, and invoke Amazon Bedrock LLMs without operational single points of failure.
          </p>

          {/* 3D AWS IoT & ML Pipeline Visual Banner */}
          <div className="relative border-[3px] border-ink bg-night shadow-[4px_4px_0_var(--ink)] overflow-hidden">
            <div className="relative h-64 sm:h-72 w-full overflow-hidden">
              <img
                src="/src/assets/images/aws_iot_ml_pipeline_1791698454752.jpg"
                alt="AWS IoT Core, Lambda, DynamoDB, Bedrock and S3 Data Lake 3D Isometric Pipeline"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3 bg-night/90 border border-sun px-3 py-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sun animate-pulse" />
                <span className="font-mono text-[10px] font-black text-sun uppercase tracking-wider">
                  AWS CDK v2 PIPELINE INFRASTRUCTURE (IOT → LAMBDA → DYNAMODB → BEDROCK)
                </span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <span className="bg-night/90 border border-white/20 px-2 py-0.5 font-mono text-[9px] text-white">
                  INGESTION: MQTT 15-MIN CRON
                </span>
                <span className="bg-night/90 border border-white/20 px-2 py-0.5 font-mono text-[9px] text-coral font-bold">
                  DYNAMODB: SINGLE-TABLE TELEMETRY
                </span>
                <span className="bg-night/90 border border-white/20 px-2 py-0.5 font-mono text-[9px] text-mint font-bold">
                  AMAZON BEDROCK: NOVA MICRO
                </span>
              </div>
            </div>
          </div>

          {/* ASCII / Monospace Architecture Blueprint */}
          <div className="border-[3px] border-ink bg-night p-4 text-paper font-mono text-[11px] overflow-x-auto shadow-[4px_4px_0_var(--coral)]">
            <pre className="text-paper/90 leading-tight">
{`┌─────────────────────────────────────────────────────────────────────────┐
│                         AERIS — AWS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
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
└─────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          {/* Security & Best Practices Table */}
          <div>
            <h3 className="text-sm font-black uppercase text-ink font-display mb-3">
              Cloud Security &amp; Engineering Controls
            </h3>
            <div className="overflow-x-auto border-[2px] border-ink bg-white">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-ink bg-paper text-[10px] uppercase text-ink-soft">
                    <th className="p-2.5">Security Control</th>
                    <th className="p-2.5">Implementation Specification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-xs">
                  <tr>
                    <td className="p-2.5 font-bold text-ink">Least-Privilege IAM</td>
                    <td className="p-2.5 text-ink-soft"><code>bedrock:InvokeModel</code> strictly scoped to foundation-model ARNs; zero wildcard administrator permissions.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-ink">S3 Hardening</td>
                    <td className="p-2.5 text-ink-soft"><code>BlockPublicAccess.BLOCK_ALL</code>, AWS KMS SSE encryption, <code>enforceSSL: true</code>, 90-day lifecycle expiration.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-ink">DynamoDB Encryption</td>
                    <td className="p-2.5 text-ink-soft">AWS-managed encryption at rest (SSE) + Point-in-Time Recovery (PITR) enabled.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-ink">Zero Secrets in Bundle</td>
                    <td className="p-2.5 text-ink-soft">Automated test verifies zero AWS access keys or secrets in the client distribution build.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-ink">Lambda Input Guards</td>
                    <td className="p-2.5 text-ink-soft">ISO 8601 validation, station registry whitelist, physical PM2.5 range checks (0–1000 µg/m³).</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-ink">Provenance Invariance</td>
                    <td className="p-2.5 text-ink-soft">Ingestion Lambda strictly prevents <code>SIMULATED</code> data from being mutated into <code>MEASURED</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 border-t-[3px] border-ink pt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-ink-soft">
            AWS CDK STACK: AerisStack (us-east-1)
          </span>
          <button
            onClick={onClose}
            className="brutal-button bg-ink text-paper px-5 py-2 text-xs shadow-[3px_3px_0_var(--sun)] cursor-pointer"
          >
            Close Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
