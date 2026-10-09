import { useEffect } from 'react';
import { useAerisStore } from '@/store/aerisStore';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { STATION_MAP } from '@/data/stations';

export function InterventionFlightHUD() {
  const {
    isFlightActive,
    activeFlightStep,
    selectedStationId,
    activeScenarioImpact,
    resetInterventionControls,
    exitInterventionFlight,
    setFlightStep,
  } = useAerisStore();

  const station = selectedStationId ? STATION_MAP.get(selectedStationId) : null;

  // Keyboard shortcut listener: Escape resets and exits flight mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFlightActive) {
        exitInterventionFlight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlightActive, exitInterventionFlight]);

  if (!isFlightActive || !station) return null;

  const impact6h = activeScenarioImpact?.horizons['6h'];
  const hasActiveIntervention =
    impact6h && Math.abs(impact6h.absoluteDelta) > 0.1;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(8, 12, 20, 0.98) 0%, rgba(14, 20, 32, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '2px solid #38bdf8',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        boxShadow: '0 8px 32px rgba(8, 12, 20, 0.8), 0 0 20px rgba(56, 189, 248, 0.2)',
        zIndex: 30,
        position: 'relative',
      }}
      role="banner"
      aria-label="The Intervention Flight Control Center"
    >
      {/* Left: Flight Badge & Station Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38bdf8',
            color: '#38bdf8',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
          }}
        >
          <span className="mode-pill--dot" style={{ background: '#38bdf8' }} />
          ✈ INTERVENTION FLIGHT
        </div>

        <div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Target: {station.name} ({station.locality})
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Coords: {station.coordinates.lat}° N, {station.coordinates.lng}° E · Continuous Intelligence Track
          </div>
        </div>
      </div>

      {/* Center: 5-Stage Guided Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {[
          { step: 1, label: '01 · OBSERVE' },
          { step: 2, label: '02 · UNDERSTAND' },
          { step: 3, label: '03 · PREDICT' },
          { step: 4, label: '04 · INTERVENE' },
          { step: 5, label: '05 · BRIEFING' },
        ].map((item) => {
          const isActive = activeFlightStep === item.step;
          return (
            <button
              key={item.step}
              onClick={() => setFlightStep(item.step)}
              className={`briefing-stepper-btn ${isActive ? 'briefing-stepper-btn--active' : ''}`}
              style={{ fontSize: '10px', padding: '4px 8px' }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right: Live Scenario Delta & Flight Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {hasActiveIntervention && impact6h && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: '#22c55e',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              6h Impact: {impact6h.absoluteDelta} µg/m³ ({impact6h.percentageDelta}%)
            </div>
            <ProvenanceBadge provenance="ESTIMATED" compact />
          </div>
        )}

        <button
          onClick={resetInterventionControls}
          style={{
            padding: '4px 10px',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--aqi-moderate)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          title="Reset intervention sliders to 0%"
        >
          ↺ RESET SCENARIO
        </button>

        <button
          onClick={exitInterventionFlight}
          style={{
            padding: '4px 12px',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          title="Return to regional view (Esc)"
        >
          ✕ EXIT FLIGHT
        </button>
      </div>
    </div>
  );
}
