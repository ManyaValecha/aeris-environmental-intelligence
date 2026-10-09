import { useEffect } from 'react';
import { CommandHeader } from '@/components/layout/CommandHeader';
import { DelhiMapPanel } from '@/components/map/DelhiMapPanel';
import { StationGrid } from '@/components/stations/StationGrid';
import { StationIntelligencePanel } from '@/components/analytics/StationIntelligencePanel';
import { AtmosphericCanvas } from '@/components/common/AtmosphericCanvas';
import { useAerisStore } from '@/store/aerisStore';

/**
 * App
 *
 * AERIS Command Centre — root application component.
 * Phase 2B: Spatial map, station grid, and validated forecast intelligence layer.
 *
 * Layout (two-column, scrollable intelligence right panel):
 *   ┌────────────────────────────────────────────────────────┐
 *   │                 CommandHeader (64px)                   │
 *   ├─────────────────┬──────────────────────────────────────┤
 *   │  DelhiMapPanel  │ StationIntelligencePanel + Grid      │
 *   │  (left, 42%)   │ (right, 58%, scrollable)            │
 *   └─────────────────┴──────────────────────────────────────┘
 */
export function App() {
  const { currentReadings, selectedStationId, isLoading, refreshReadings, selectStation } =
    useAerisStore();

  // Initial data load
  useEffect(() => {
    void refreshReadings();
  }, [refreshReadings]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-bg-base)',
        position: 'relative',
      }}
    >
      <AtmosphericCanvas />
      <CommandHeader />

      {/* ─── Main Content ─── */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '42% 58%',
          gridTemplateRows: '1fr',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* ─── Left: Spatial Map ─── */}
        <section
          aria-label="Delhi NCR pollution map"
          style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <DelhiMapPanel
            readings={currentReadings}
            selectedStationId={selectedStationId}
            onStationSelect={selectStation}
          />
        </section>

        {/* ─── Right: Intelligence Layer + Station Grid ─── */}
        <section
          aria-label="Monitoring station intelligence and readings"
          style={{
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
            paddingRight: 'var(--space-2)',
          }}
        >
          {/* Phase 2B Forecast & Historical Intelligence Layer */}
          <StationIntelligencePanel />

          {/* Section header for Station Grid */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <h1
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-text-secondary)',
              }}
            >
              All Station Telemetry
              <span
                style={{
                  marginLeft: 'var(--space-2)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                ({currentReadings.length} / 8)
              </span>
            </h1>
            {currentReadings.length > 0 && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Click any station card to change focus
              </span>
            )}
          </div>

          <StationGrid
            readings={currentReadings}
            selectedStationId={selectedStationId}
            onSelect={selectStation}
            isLoading={isLoading}
          />
        </section>
      </main>
    </div>
  );
}
