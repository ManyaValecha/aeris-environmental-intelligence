import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';

interface AwsArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AwsArchitectureModal({ isOpen, onClose }: AwsArchitectureModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(4, 7, 13, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      role="dialog"
      aria-labelledby="aws-modal-title"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                }}
              >
                AWS CDK v2 ARCHITECTURE AUDIT
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Synthesized Cloud Infrastructure & Local Tests
              </span>
            </div>
            <h2
              id="aws-modal-title"
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-display)',
                marginTop: 'var(--space-1)',
              }}
            >
              AERIS AWS Reference Architecture & Local Trace
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Pipeline Topology */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#38bdf8',
              fontWeight: 700,
            }}
          >
            End-to-End Telemetry Signal Lifecycle
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 'var(--space-3)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>01 SOURCE</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>CPCB / IoT MQTT</div>
              <div style={{ marginTop: '4px' }}><ProvenanceBadge provenance="MEASURED" compact /></div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>02 SCHEDULER</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>EventBridge</div>
              <div style={{ marginTop: '4px' }}><ProvenanceBadge provenance="SIMULATED" compact /></div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>03 VALIDATION</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>Ingestion Lambda</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Boundary Guard</div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>04 STORAGE</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>DynamoDB + S3</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>PK=STATION#id</div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>05 REASONING</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>Amazon Bedrock</div>
              <div style={{ marginTop: '4px' }}><ProvenanceBadge provenance="AI_GENERATED" compact /></div>
            </div>
          </div>
        </div>

        {/* Verification Matrix: Local vs Cloud */}
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
            ✓ LOCAL VERIFICATION vs. CLOUD PREREQUISITES AUDIT
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>
                LOCAL VERIFIED LOGIC (100% Zero-Cost Tested)
              </div>
              <ul style={{ fontSize: '11px', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>CDK v2 CloudFormation synthesis (`cdk synth`)</li>
                <li>Ingestion Lambda validation (`validateTelemetryPayload`)</li>
                <li>API Gateway proxy routing (`api.handler`)</li>
                <li>Bedrock prompt context grounding (`buildCopilotContext`)</li>
                <li>Frontend transparent fallback to DEMO mode</li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                CLOUD DEPLOYED PREREQUISITES
              </div>
              <ul style={{ fontSize: '11px', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>Live AWS DynamoDB On-Demand Table instance</li>
                <li>Live AWS S3 bucket (`aeris-model-artifacts`)</li>
                <li>Live API Gateway REST endpoint (`VITE_AERIS_API_URL`)</li>
                <li>Active AWS IAM credentials for Bedrock runtime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deployment Commands */}
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
          }}
        >
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>Authorized Deployment Commands (Requires AWS Credentials):</div>
          <div style={{ color: '#38bdf8' }}>cd infra && npm run build && cdk synth</div>
          <div style={{ color: '#38bdf8', marginTop: '2px' }}>cdk deploy AerisStack --require-approval broadening</div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: 'var(--space-2) var(--space-5)',
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Close Architecture View
          </button>
        </div>
      </div>
    </div>
  );
}
