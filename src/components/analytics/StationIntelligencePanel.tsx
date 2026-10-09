import { useAerisStore } from '@/store/aerisStore';
import { STATION_MAP } from '@/data/stations';
import { HistoricalTrendChart } from '@/components/analytics/HistoricalTrendChart';
import { ForecastSummary } from '@/components/analytics/ForecastSummary';
import { ModelTransparencyPanel } from '@/components/analytics/ModelTransparencyPanel';
import { AnomalyAlertBanner } from '@/components/analytics/AnomalyAlertBanner';
import { InterventionSimulator } from '@/components/analytics/InterventionSimulator';
import { CopilotPanel } from '@/components/analytics/CopilotPanel';

export function StationIntelligencePanel() {
  const {
    selectedStationId,
    currentReadings,
    currentForecast,
    historicalSeries,
    activeAnomalies,
    dataMode,
  } = useAerisStore();

  const selectedStation = selectedStationId ? STATION_MAP.get(selectedStationId) : null;
  const currentTelemetry = currentReadings.find((r) => r.stationId === selectedStationId);

  if (!selectedStation || !currentTelemetry) {
    return (
      <div
        className="panel"
        style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        Select a monitoring station from the map or grid to inspect historical trends and empirical forecast trajectories.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Station Title Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingBottom: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {selectedStation.name} Intelligence
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {selectedStation.locality} · Coordinates: {selectedStation.coordinates.lat}, {selectedStation.coordinates.lng}
          </p>
        </div>
      </div>

      {/* 1. Anomaly Alerts */}
      <AnomalyAlertBanner anomalies={activeAnomalies} />

      {/* 2. Forecast Trajectory Summary (NEXT) */}
      <ForecastSummary forecast={currentForecast} currentPm25={currentTelemetry.pollutants.pm25} />

      {/* 3. Historical Trend Chart (WHAT) */}
      <HistoricalTrendChart series={historicalSeries} stationName={selectedStation.name} />

      {/* 4. Intervention Scenario Simulator (ACTION/INTERVENE) */}
      <InterventionSimulator forecast={currentForecast} />

      {/* 5. Environmental Copilot Intelligence Briefing */}
      {currentForecast && (
        <CopilotPanel
          telemetry={currentTelemetry}
          forecast={currentForecast}
          historical={historicalSeries}
          anomalies={activeAnomalies}
          dataMode={dataMode}
        />
      )}

      {/* 6. Model Transparency & Evaluation Matrix */}
      <ModelTransparencyPanel />
    </div>
  );
}
