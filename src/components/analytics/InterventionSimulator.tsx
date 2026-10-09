import { useState, useCallback } from 'react';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { computeScenarioImpact, DEFAULT_CONTROLS } from '@/services/interventionService';
import type { StationForecast } from '@/types/forecast';
import type { InterventionControls, ScenarioImpact } from '@/types/intervention';

interface InterventionSimulatorProps {
  forecast: StationForecast | null;
}

const SLIDER_CONFIGS = [
  {
    key: 'trafficReductionFraction' as keyof InterventionControls,
    label: 'Traffic Emissions',
    description: 'Vehicle exhaust reduction (NO₂, CO, BC)',
    color: '#f97316',
  },
  {
    key: 'constructionReductionFraction' as keyof InterventionControls,
    label: 'Construction Dust',
    description: 'Road & building dust suspension reduction',
    color: '#eab308',
  },
  {
    key: 'industrialReductionFraction' as keyof InterventionControls,
    label: 'Industrial Activity',
    description: 'Combustion & waste burning reduction',
    color: '#a855f7',
  },
] as const;

function SliderControl({
  config,
  value,
  onChange,
}: {
  config: typeof SLIDER_CONFIGS[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {config.label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: config.color, fontWeight: 600 }}>
          −{pct}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={50}
        step={5}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label={`${config.label} reduction: ${pct}%`}
        style={{
          width: '100%',
          accentColor: config.color,
          cursor: 'pointer',
          height: '4px',
        }}
      />
      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
        {config.description}
      </span>
    </div>
  );
}

export function InterventionSimulator({ forecast }: InterventionSimulatorProps) {
  const [controls, setControls] = useState<InterventionControls>(DEFAULT_CONTROLS);
  const [scenario, setScenario] = useState<ScenarioImpact | null>(null);

  const handleSliderChange = useCallback(
    (key: keyof InterventionControls, value: number) => {
      const next = { ...controls, [key]: value };
      setControls(next);
      if (forecast) {
        setScenario(computeScenarioImpact(forecast, next));
      }
    },
    [controls, forecast]
  );

  if (!forecast) {
    return (
      <div
        className="panel"
        style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}
      >
        Select a station to configure intervention scenarios.
      </div>
    );
  }

  // Compute initial scenario on render if controls non-zero
  const activeScenario = scenario ?? computeScenarioImpact(forecast, controls);

  const hasInterventions = controls.trafficReductionFraction > 0 ||
    controls.constructionReductionFraction > 0 ||
    controls.industrialReductionFraction > 0;

  return (
    <div className="panel" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="panel-title" style={{ fontSize: 'var(--text-xs)' }}>
            Intervention Scenario Simulator
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            Scenario sensitivity model — not a causal prediction
          </div>
        </div>
        <ProvenanceBadge provenance="ESTIMATED" />
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {SLIDER_CONFIGS.map((cfg) => (
          <SliderControl
            key={cfg.key}
            config={cfg}
            value={controls[cfg.key]}
            onChange={(v) => handleSliderChange(cfg.key, v)}
          />
        ))}
      </div>

      {/* Comparison Grid — Baseline vs Scenario for each horizon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--space-3)',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: 'var(--space-3)',
        }}
      >
        {(['1h', '6h', '24h'] as const).map((h) => {
          const impact = activeScenario.horizons[h];
          const isImproved = impact.absoluteDelta < 0;
          const deltaColor = isImproved ? '#22c55e' : impact.absoluteDelta > 0 ? '#ef4444' : 'var(--color-text-muted)';

          return (
            <div
              key={h}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span className="data-label" style={{ fontSize: '10px' }}>
                {h === '1h' ? 'NEXT 1H' : h === '6h' ? 'NEXT 6H' : 'NEXT 24H'}
              </span>

              {/* Baseline */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', minWidth: '56px' }}>
                  Baseline:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {impact.baselinePm25}
                </span>
              </div>

              {/* Scenario */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', minWidth: '56px' }}>
                  Scenario:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: impact.scenarioCategoryColor }}>
                  {impact.scenarioPm25}
                </span>
              </div>

              {/* Delta */}
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: deltaColor,
                  borderTop: `1px solid ${deltaColor}30`,
                  paddingTop: '4px',
                }}
              >
                {isImproved ? '↓' : impact.absoluteDelta > 0 ? '↑' : '='}{' '}
                {Math.abs(impact.absoluteDelta)} µg/m³
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
                  {' '}({Math.abs(impact.percentageDelta)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision Summary */}
      {hasInterventions && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
          }}
        >
          <strong style={{ fontStyle: 'normal', color: 'var(--color-text-primary)' }}>
            Estimated Impact:
          </strong>{' '}
          {activeScenario.deterministic_summary}
        </div>
      )}

      {/* Disclaimer always visible */}
      <div
        style={{
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: 'var(--space-2)',
        }}
      >
        ⚠ {activeScenario.disclaimer}
      </div>
    </div>
  );
}
