import { useState, useRef } from 'react';
import { useAerisStore } from '@/store/aerisStore';
import { STATION_MAP } from '@/data/stations';
import { HistoricalTrendChart } from '@/components/analytics/HistoricalTrendChart';
import { ForecastSummary } from '@/components/analytics/ForecastSummary';
import { ModelTransparencyPanel } from '@/components/analytics/ModelTransparencyPanel';
import { AnomalyAlertBanner } from '@/components/analytics/AnomalyAlertBanner';
import { InterventionSimulator } from '@/components/analytics/InterventionSimulator';
import { CopilotPanel } from '@/components/analytics/CopilotPanel';

type MissionPhase = 'ALL' | 'OBSERVE' | 'UNDERSTAND' | 'PREDICT' | 'INTERVENE';

export function StationIntelligencePanel() {
  const {
    selectedStationId,
    currentReadings,
    currentForecast,
    historicalSeries,
    activeAnomalies,
    dataMode,
  } = useAerisStore();

  const [activePhase, setActivePhase] = useState<MissionPhase>('ALL');

  const observeRef = useRef<HTMLDivElement>(null);
  const understandRef = useRef<HTMLDivElement>(null);
  const predictRef = useRef<HTMLDivElement>(null);
  const interveneRef = useRef<HTMLDivElement>(null);

  const selectedStation = selectedStationId ? STATION_MAP.get(selectedStationId) : null;
  const currentTelemetry = currentReadings.find((r) => r.stationId === selectedStationId);

  const scrollToRef = (phase: MissionPhase, ref: React.RefObject<HTMLDivElement>) => {
    setActivePhase(phase);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const showObserve = activePhase === 'ALL' || activePhase === 'OBSERVE';
  const showUnderstand = activePhase === 'ALL' || activePhase === 'UNDERSTAND';
  const showPredict = activePhase === 'ALL' || activePhase === 'PREDICT';
  const showIntervene = activePhase === 'ALL' || activePhase === 'INTERVENE';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Station Title & Mission Stepper Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
              }}
            >
              {selectedStation.name} Command Briefing
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {selectedStation.locality} · Node {selectedStation.id} · ({selectedStation.coordinates.lat}° N, {selectedStation.coordinates.lng}° E)
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ color: currentTelemetry.aqi.categoryColor, fontWeight: 700 }}>
              AQI {currentTelemetry.aqi.value} ({currentTelemetry.aqi.category})
            </span>
          </div>
        </div>

        {/* 4-Stage Guided Mission Stepper Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
          role="tablist"
          aria-label="Mission Briefing Guided Stepper"
        >
          <button
            onClick={() => setActivePhase('ALL')}
            className={`briefing-stepper-btn ${activePhase === 'ALL' ? 'briefing-stepper-btn--active' : ''}`}
            role="tab"
            aria-selected={activePhase === 'ALL'}
          >
            VIEW ALL PHASES
          </button>
          <button
            onClick={() => scrollToRef('OBSERVE', observeRef)}
            className={`briefing-stepper-btn ${activePhase === 'OBSERVE' ? 'briefing-stepper-btn--active' : ''}`}
            role="tab"
            aria-selected={activePhase === 'OBSERVE'}
          >
            01 · OBSERVE
          </button>
          <button
            onClick={() => scrollToRef('UNDERSTAND', understandRef)}
            className={`briefing-stepper-btn ${activePhase === 'UNDERSTAND' ? 'briefing-stepper-btn--active' : ''}`}
            role="tab"
            aria-selected={activePhase === 'UNDERSTAND'}
          >
            02 · UNDERSTAND
          </button>
          <button
            onClick={() => scrollToRef('PREDICT', predictRef)}
            className={`briefing-stepper-btn ${activePhase === 'PREDICT' ? 'briefing-stepper-btn--active' : ''}`}
            role="tab"
            aria-selected={activePhase === 'PREDICT'}
          >
            03 · PREDICT
          </button>
          <button
            onClick={() => scrollToRef('INTERVENE', interveneRef)}
            className={`briefing-stepper-btn ${activePhase === 'INTERVENE' ? 'briefing-stepper-btn--active' : ''}`}
            role="tab"
            aria-selected={activePhase === 'INTERVENE'}
          >
            04 · INTERVENE
          </button>
        </div>
      </div>

      {/* PHASE 01: OBSERVE */}
      {showObserve && (
        <div ref={observeRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.12em',
              color: '#38bdf8',
              textTransform: 'uppercase',
            }}
          >
            STAGE 01 · OBSERVE (Real-Time Sensor Ground Truth & Anomaly Detection)
          </div>
          <AnomalyAlertBanner anomalies={activeAnomalies} />
        </div>
      )}

      {/* PHASE 02: UNDERSTAND */}
      {showUnderstand && (
        <div ref={understandRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.12em',
              color: '#84cc16',
              textTransform: 'uppercase',
              marginTop: 'var(--space-2)',
            }}
          >
            STAGE 02 · UNDERSTAND (30-Day Historical Trend & Model Validation)
          </div>
          <HistoricalTrendChart series={historicalSeries} stationName={selectedStation.name} />
          <ModelTransparencyPanel />
        </div>
      )}

      {/* PHASE 03: PREDICT */}
      {showPredict && (
        <div ref={predictRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.12em',
              color: '#f59e0b',
              textTransform: 'uppercase',
              marginTop: 'var(--space-2)',
            }}
          >
            STAGE 03 · PREDICT (Multi-Horizon ML Forecast Trajectory & Uncertainty Bounds)
          </div>
          <ForecastSummary forecast={currentForecast} currentPm25={currentTelemetry.pollutants.pm25} />
        </div>
      )}

      {/* PHASE 04: INTERVENE */}
      {showIntervene && (
        <div ref={interveneRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.12em',
              color: '#a855f7',
              textTransform: 'uppercase',
              marginTop: 'var(--space-2)',
            }}
          >
            STAGE 04 · INTERVENE (Policy Sensitivity Simulator & Bedrock Copilot Briefing)
          </div>
          <InterventionSimulator forecast={currentForecast} />
          {currentForecast && (
            <CopilotPanel
              telemetry={currentTelemetry}
              forecast={currentForecast}
              historical={historicalSeries}
              anomalies={activeAnomalies}
              dataMode={dataMode}
            />
          )}
        </div>
      )}
    </div>
  );
}
