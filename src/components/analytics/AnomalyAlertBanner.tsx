import type { AnomalyRecord } from '@/services/anomalyService';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';

interface AnomalyAlertProps {
  anomalies: AnomalyRecord[];
}

export function AnomalyAlertBanner({ anomalies }: AnomalyAlertProps) {
  if (anomalies.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      {anomalies.map((anom) => {
        const severityColor =
          anom.severity === 'CRITICAL'
            ? '#ef4444'
            : anom.severity === 'HIGH'
            ? '#f97316'
            : '#f59e0b';

        return (
          <div
            key={anom.id}
            style={{
              background: `${severityColor}12`,
              border: `1px solid ${severityColor}40`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span
                style={{
                  color: severityColor,
                  fontWeight: 700,
                  fontSize: 'var(--text-md)',
                  lineHeight: 1,
                  marginTop: '2px',
                }}
              >
                ⚠
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      color: severityColor,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {anom.severity} ANOMALY DETECTED — {anom.stationName}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Score: {anom.anomalyScore}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                  {anom.explanation}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  Observed: {anom.observedValue} µg/m³ | Rolling Baseline: {anom.baselineValue} µg/m³
                </div>
              </div>
            </div>

            <ProvenanceBadge provenance={anom.provenance} compact />
          </div>
        );
      })}
    </div>
  );
}
