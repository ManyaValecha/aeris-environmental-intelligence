import { useEffect } from 'react';
import { CommandHeader } from '@/components/layout/CommandHeader';
import { DelhiMapPanel } from '@/components/map/DelhiMapPanel';
import { StationGrid } from '@/components/stations/StationGrid';
import { StationIntelligencePanel } from '@/components/analytics/StationIntelligencePanel';
import { AtmosphericCanvas } from '@/components/common/AtmosphericCanvas';
import { AtmosphericDigitalTwinBanner } from '@/components/common/AtmosphericDigitalTwinBanner';
import { ForecastTimelineScrubber } from '@/components/analytics/ForecastTimelineScrubber';
import { InterventionFlightHUD } from '@/components/analytics/InterventionFlightHUD';
import { useAerisStore } from '@/store/aerisStore';

/**
 * App
 *
 * AERIS Command Centre — root application component.
 * Immersive Atmospheric Digital Twin for Delhi NCR.
 */
export function App() {
  const { currentReadings, selectedStationId, isLoading, refreshReadings, selectStation } =
    useAerisStore();

  const selectedTelemetry = currentReadings.find((r) => r.stationId === selectedStationId) || currentReadings[0];

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
      {/* Background Particle & Wind Vector Canvas */}
      <AtmosphericCanvas />

      {/* Command Navigation Header */}
      <CommandHeader />

      {/* The Intervention Flight HUD Banner */}
      <InterventionFlightHUD />

      {/* Main Command Dashboard Layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* AERIS Signature Earth-Observation Digital Twin HUD */}
        <AtmosphericDigitalTwinBanner telemetry={selectedTelemetry} />

        {/* Forecast Timeline Horizon Scrubber */}
        <ForecastTimelineScrubber />

        {/* Core Split Screen: Spatial Map (Left) + 4-Stage Mission Briefing (Right) */}
        <main
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '40% 60%',
            gridTemplateRows: '1fr',
            gap: 'var(--space-4)',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* Left: Geographic Map Matrix */}
          <section
            aria-label="Delhi NCR spatial pollution map"
            style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            <DelhiMapPanel
              readings={currentReadings}
              selectedStationId={selectedStationId}
              onStationSelect={selectStation}
            />
          </section>

          {/* Right: 4-Stage Guided Mission Briefing & Telemetry Grid */}
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
            {/* 4-Stage Guided Mission Briefing Panel */}
            <StationIntelligencePanel />

            {/* Section Header for Station Grid */}
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
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ALL CPCB STATIONS TELEMETRY
                <span
                  style={{
                    marginLeft: 'var(--space-2)',
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                  }}
                >
                  ({currentReadings.length} / 8 ACTIVE)
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
                  Select station card to focus
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
    </div>
  );
}
