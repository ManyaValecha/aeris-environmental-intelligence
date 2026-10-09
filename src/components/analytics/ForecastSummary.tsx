import type { StationForecast, ForecastHorizon } from '@/types/forecast';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';

interface ForecastSummaryProps {
  forecast: StationForecast | null;
  currentPm25: number;
}

export function ForecastSummary({ forecast, currentPm25 }: ForecastSummaryProps) {
  if (!forecast) {
    return (
      <div className="panel" style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
        Select a station to calculate PM2.5 forecast trajectory.
      </div>
    );
  }

  const horizons: { id: ForecastHorizon; label: string; modelName: string }[] = [
    { id: '1h', label: 'NEXT 1H', modelName: 'XGBoost Regressor' },
    { id: '6h', label: 'NEXT 6H', modelName: 'LightGBM Regressor' },
    { id: '24h', label: 'NEXT 24H', modelName: 'Persistence Baseline' },
  ];

  return (
    <div className="panel" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="panel-title" style={{ fontSize: 'var(--text-xs)' }}>
            Empirical PM2.5 Forecast Trajectory
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Prediction range — empirical uncertainty estimate (±1.96 × RMSE)
          </div>
        </div>
        <ProvenanceBadge provenance="PREDICTED" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-3)',
        }}
      >
        {horizons.map(({ id, label, modelName }) => {
          const pt = forecast.predictions[id];
          const delta = pt.predictedPm25 - currentPm25;
          const isSurge = delta > 2;
          const isImprovement = delta < -2;

          const arrowSymbol = isSurge ? '↑' : isImprovement ? '↓' : '→';
          const arrowColor = isSurge ? '#ef4444' : isImprovement ? '#22c55e' : 'var(--color-text-secondary)';

          return (
            <div
              key={id}
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="data-label" style={{ fontSize: '10px' }}>{label}</span>
                <span style={{ color: arrowColor, fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
                  {arrowSymbol} {Math.abs(delta).toFixed(1)}
                </span>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 500, color: pt.categoryColor }}>
                  {pt.predictedPm25} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>µg/m³</span>
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: pt.categoryColor,
                    background: `${pt.categoryColor}15`,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${pt.categoryColor}30`,
                  }}
                >
                  {pt.predictedAqiCategory.replace('_', ' ')}
                </div>
              </div>

              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '4px' }}>
                <div>Model: {modelName}</div>
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                  Range: [{pt.lowerBoundPm25} - {pt.upperBoundPm25}]
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
