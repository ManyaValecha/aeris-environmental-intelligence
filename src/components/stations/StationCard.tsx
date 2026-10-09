import type { StationTelemetry } from '@/types';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { STATION_MAP } from '@/data/stations';
import { formatIST } from '@/utils/formatters';

interface StationCardProps {
  telemetry: StationTelemetry;
  isSelected?: boolean;
  onClick?: () => void;
}

const POLLUTANT_ROWS: { key: keyof StationTelemetry['pollutants']; label: string; unit: string }[] = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10', label: 'PM10',  unit: 'µg/m³' },
  { key: 'no2',  label: 'NO₂',   unit: 'µg/m³' },
  { key: 'so2',  label: 'SO₂',   unit: 'µg/m³' },
  { key: 'co',   label: 'CO',    unit: 'mg/m³'  },
  { key: 'o3',   label: 'O₃',    unit: 'µg/m³' },
];

/**
 * StationCard
 *
 * Displays current telemetry for a single monitoring station.
 * Always renders the ProvenanceBadge — the user must always know the
 * data origin. Selected state is highlighted visually.
 */
export function StationCard({ telemetry, isSelected = false, onClick }: StationCardProps) {
  const station = STATION_MAP.get(telemetry.stationId);
  const { aqi, pollutants, weather, provenance, timestamp } = telemetry;

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      aria-pressed={isSelected}
      aria-label={`${station?.name ?? telemetry.stationId} station — AQI ${aqi.value}, ${aqi.category}`}
      style={{
        background: isSelected ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
        border: `1px solid ${isSelected ? aqi.categoryColor : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color var(--transition-base), background var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        boxShadow: isSelected ? `0 0 0 1px ${aqi.categoryColor}22, var(--shadow-md)` : 'none',
      }}
    >
      {/* ─── Card Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {station?.name ?? telemetry.stationId}
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {station?.locality ?? ''}
          </p>
        </div>
        <ProvenanceBadge provenance={provenance} />
      </div>

      {/* ─── AQI Hero ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <div>
          <div className="data-label" style={{ marginBottom: 'var(--space-1)' }}>AQI (NAQI)</div>
          <div
            className="data-value-primary"
            style={{ color: aqi.categoryColor, lineHeight: 1 }}
            aria-label={`AQI value: ${aqi.value}`}
          >
            {aqi.value}
          </div>
        </div>
        <div style={{ paddingBottom: '4px' }}>
          <span
            className="aqi-chip"
            style={{
              background: `${aqi.categoryColor}15`,
              color: aqi.categoryColor,
              border: `1px solid ${aqi.categoryColor}40`,
            }}
          >
            {aqi.category.replace('_', ' ')}
          </span>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Primary: {pollutants[aqi.primaryPollutant]} µg/m³ {aqi.primaryPollutant.toUpperCase()}
          </div>
        </div>
      </div>

      {/* ─── Pollutant Grid ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-2)',
        }}
      >
        {POLLUTANT_ROWS.map(({ key, label, unit }) => (
          <div
            key={key}
            style={{
              background: 'var(--color-bg-base)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              border: aqi.primaryPollutant === key
                ? `1px solid ${aqi.categoryColor}50`
                : '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="data-label" style={{ marginBottom: '2px', fontSize: '10px' }}>
              {label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: aqi.primaryPollutant === key ? aqi.categoryColor : 'var(--color-text-primary)',
              }}
            >
              {key === 'co' ? pollutants[key].toFixed(1) : Math.round(pollutants[key])}
            </div>
            <div className="data-unit" style={{ fontSize: '10px' }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* ─── Weather Row ─── */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          paddingTop: 'var(--space-2)',
          borderTop: '1px solid var(--color-border-subtle)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Temp', value: `${weather.temperatureCelsius.toFixed(1)}°C` },
          { label: 'Humidity', value: `${weather.relativeHumidityPct}%` },
          { label: 'Wind', value: `${weather.windSpeedKmH.toFixed(1)} km/h ${weather.windDirectionLabel}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ fontSize: 'var(--text-xs)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>{label} </span>
            <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Timestamp ─── */}
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
        As of {formatIST(timestamp)} IST
      </div>
    </article>
  );
}
