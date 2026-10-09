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
        backgroundColor: 'rgba(4, 7, 13, 0.85)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '840px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
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
                  color: 'var(--prov-reanalysis)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                }}
              >
                AWS CDK v2 STACK
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Synthesized Cloud Architecture
              </span>
            </div>
            <h2
              id="aws-modal-title"
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginTop: 'var(--space-1)',
              }}
            >
              AERIS AWS Production Integration
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

        {/* Architecture Topology */}
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
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
            }}
          >
            Pipeline Topology & Data Flow
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>01 SOURCE</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>CPCB / Reanalysis</div>
              <div style={{ marginTop: '4px' }}><ProvenanceBadge provenance="REANALYSIS" /></div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>02 SCHEDULER</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>EventBridge</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>15-min Rate Rule</div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>03 INGESTION</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>AWS Lambda</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Schema Validator</div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>04 STORAGE</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>DynamoDB</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>On-Demand Table</div>
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>05 API & AI</div>
              <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>APIGW + Bedrock</div>
              <div style={{ marginTop: '4px' }}><ProvenanceBadge provenance="AI_GENERATED" /></div>
            </div>
          </div>
        </div>

        {/* Security & Provenance Rules */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
              🔒 Security & IAM
            </h3>
            <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Least-privilege Lambda execution roles</li>
              <li>S3 Block Public Access & SSL enforced</li>
              <li>DynamoDB server-side KMS encryption</li>
              <li>Zero credentials in VITE client bundles</li>
            </ul>
          </div>

          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
              🏷️ Provenance Guarantee
            </h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Infrastructure routing never alters data provenance. EventBridge simulated triggers stay labeled as{' '}
              <span style={{ color: 'var(--prov-simulated)', fontWeight: 600 }}>SIMULATED</span> — never upgraded to MEASURED.
            </div>
          </div>
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
