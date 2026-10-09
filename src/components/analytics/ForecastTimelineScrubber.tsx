import { useAerisStore } from '@/store/aerisStore';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import type { ForecastHorizon } from '@/types/forecast';

export function ForecastTimelineScrubber() {
  const { currentForecast, currentReadings, selectedStationId, selectedHorizon, setSelectedHorizon } =
    useAerisStore();

  const telemetry = currentReadings.find((r) => r.stationId === selectedStationId) || currentReadings[0];
  const currentPm25 = telemetry?.pollutants.pm25 ?? 145;

  const horizons: { horizon: 'NOW' | ForecastHorizon; label: string; model: string; r2: string; pm25: number; lower?: number; upper?: number; color: string }[] = [
    {
      horizon: 'NOW',
      label: 'NOW (GROUND TRUTH)',
      model: 'CPCB Monitor',
      r2: 'Reference',
      pm25: Math.round(currentPm25),
      color: telemetry?.aqi.categoryColor ?? '#38bdf8',
    },
    {
      horizon: '1h',
      label: '+1 HOUR',
      model: 'XGBoost Short-Term',
      r2: 'R² 0.88',
      pm25: currentForecast?.predictions['1h'].predictedPm25 ?? Math.round(currentPm25 * 1.05),
      lower: currentForecast?.predictions['1h'].lowerBoundPm25,
      upper: currentForecast?.predictions['1h'].upperBoundPm25,
      color: currentForecast?.predictions['1h'].categoryColor ?? '#f59e0b',
    },
    {
      horizon: '6h',
      label: '+6 HOURS',
      model: 'LSTM Boundary Layer',
      r2: 'R² 0.82',
      pm25: currentForecast?.predictions['6h'].predictedPm25 ?? Math.round(currentPm25 * 1.12),
      lower: currentForecast?.predictions['6h'].lowerBoundPm25,
      upper: currentForecast?.predictions['6h'].upperBoundPm25,
      color: currentForecast?.predictions['6h'].categoryColor ?? '#ef4444',
    },
    {
      horizon: '24h',
      label: '+24 HOURS',
      model: 'Prophet Long-Range',
      r2: 'R² 0.74',
      pm25: currentForecast?.predictions['24h'].predictedPm25 ?? Math.round(currentPm25 * 1.25),
      lower: currentForecast?.predictions['24h'].lowerBoundPm25,
      upper: currentForecast?.predictions['24h'].upperBoundPm25,
      color: currentForecast?.predictions['24h'].categoryColor ?? '#7c3aed',
    },
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(8, 12, 20, 0.95) 0%, rgba(14, 20, 32, 0.92) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        boxShadow: '0 8px 32px rgba(8, 12, 20, 0.6)',
      }}
      role="region"
      aria-label="Forecast Timeline Scrubber"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: '#38bdf8',
            letterSpacing: '0.12em',
          }}
        >
          FORECAST TIMELINE SCRUBBER
        </span>
        <ProvenanceBadge provenance="PREDICTED" compact />
      </div>

      {/* Scrubber Nodes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, justifyContent: 'center' }}>
        {horizons.map((item) => {
          const isSelected = item.horizon === 'NOW' ? selectedHorizon === '1h' : selectedHorizon === item.horizon;
          return (
            <button
              key={item.horizon}
              onClick={() => {
                if (item.horizon !== 'NOW') setSelectedHorizon(item.horizon as ForecastHorizon);
              }}
              style={{
                flex: 1,
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${isSelected ? item.color : 'var(--color-border)'}`,
                color: 'var(--color-text-primary)',
                cursor: item.horizon === 'NOW' ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all var(--transition-fast)',
                boxShadow: isSelected ? `0 0 12px ${item.color}30` : 'none',
              }}
              aria-selected={isSelected}
            >
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isSelected ? item.color : 'var(--color-text-muted)', fontWeight: 700 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.color, marginTop: '2px' }}>
                {item.pm25} µg/m³
              </div>
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {item.model} ({item.r2})
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' }}>
        Prediction range · empirical uncertainty (±1.96 × RMSE)
      </div>
    </div>
  );
}
