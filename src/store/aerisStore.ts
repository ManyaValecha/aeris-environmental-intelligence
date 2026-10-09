import { create } from 'zustand';
import type { DataMode, StationId, StationTelemetry } from '@/types';
import type { StationForecast } from '@/types/forecast';
import type { InterventionControls, ScenarioImpact } from '@/types/intervention';
import { DELHI_NCR_STATIONS } from '@/data/stations';
import { fetchCurrentReadings, DATA_MODE } from '@/services/apiClient';
import { generateStationForecast } from '@/services/forecastService';
import { getStationHistoricalSeries, type HistoricalPoint } from '@/services/historicalService';
import { detectAnomalies, type AnomalyRecord } from '@/services/anomalyService';
import { computeScenarioImpact, DEFAULT_CONTROLS } from '@/services/interventionService';

interface AerisState {
  // ─── Data Mode ──────────────────────────────────────────────────────────────
  dataMode: DataMode;

  // ─── Telemetry & Selection ──────────────────────────────────────────────────
  currentReadings: StationTelemetry[];
  selectedStationId: StationId | null;
  lastUpdated: string | null;

  // ─── Phase 2 Intelligence State ─────────────────────────────────────────────
  currentForecast: StationForecast | null;
  historicalSeries: HistoricalPoint[];
  activeAnomalies: AnomalyRecord[];

  // ─── Phase 8 Intervention Flight State ──────────────────────────────────────
  interventionControls: InterventionControls;
  activeScenarioImpact: ScenarioImpact | null;
  isFlightActive: boolean;
  activeFlightStep: number; // 1: OBSERVE, 2: UNDERSTAND, 3: PREDICT, 4: INTERVENE, 5: BRIEFING

  // ─── Async / Loading State ──────────────────────────────────────────────────
  isLoading: boolean;
  fetchError: string | null;

  // ─── Actions ────────────────────────────────────────────────────────────────
  refreshReadings: () => Promise<void>;
  selectStation: (id: StationId | null) => void;
  updateInterventionControls: (controls: Partial<InterventionControls>) => void;
  resetInterventionControls: () => void;
  startInterventionFlight: (stationId?: StationId) => void;
  exitInterventionFlight: () => void;
  setFlightStep: (step: number) => void;
}

export const useAerisStore = create<AerisState>((set, get) => ({
  dataMode: DATA_MODE,
  currentReadings: [],
  selectedStationId: DELHI_NCR_STATIONS[0]?.id ?? null,
  lastUpdated: null,

  currentForecast: null,
  historicalSeries: [],
  activeAnomalies: [],

  interventionControls: { ...DEFAULT_CONTROLS },
  activeScenarioImpact: null,
  isFlightActive: false,
  activeFlightStep: 1,

  isLoading: false,
  fetchError: null,

  refreshReadings: async () => {
    set({ isLoading: true, fetchError: null });
    try {
      const response = await fetchCurrentReadings();
      const readings = response.data;
      const currentSelected = get().selectedStationId ?? DELHI_NCR_STATIONS[0]?.id ?? null;

      set({
        currentReadings: readings,
        dataMode: response.dataMode,
        lastUpdated: response.timestamp,
        isLoading: false,
        fetchError: response.error ?? null,
      });

      if (currentSelected) {
        get().selectStation(currentSelected);
      }
    } catch (err) {
      set({
        isLoading: false,
        fetchError: err instanceof Error ? err.message : 'Unknown error fetching readings.',
      });
    }
  },

  selectStation: (id) => {
    if (!id) {
      set({
        selectedStationId: null,
        currentForecast: null,
        historicalSeries: [],
        activeAnomalies: [],
        activeScenarioImpact: null,
        interventionControls: { ...DEFAULT_CONTROLS },
      });
      return;
    }

    const { currentReadings, interventionControls } = get();
    const stationTelemetry = currentReadings.find((r) => r.stationId === id);

    let forecast: StationForecast | null = null;
    if (stationTelemetry) {
      forecast = generateStationForecast(stationTelemetry);
    }

    const history = getStationHistoricalSeries(id, 24);
    const stationObj = DELHI_NCR_STATIONS.find((s) => s.id === id);
    const anomalies = detectAnomalies(
      id,
      stationObj?.name ?? id,
      history.map((h) => ({ timestamp: h.timestamp, pm25: h.pm25, provenance: h.provenance }))
    );

    let impact: ScenarioImpact | null = null;
    if (forecast) {
      impact = computeScenarioImpact(forecast, interventionControls);
    }

    set({
      selectedStationId: id,
      currentForecast: forecast,
      historicalSeries: history,
      activeAnomalies: anomalies,
      activeScenarioImpact: impact,
    });
  },

  updateInterventionControls: (partialControls) => {
    const { interventionControls, currentForecast } = get();
    const updatedControls = { ...interventionControls, ...partialControls };

    let impact: ScenarioImpact | null = null;
    if (currentForecast) {
      impact = computeScenarioImpact(currentForecast, updatedControls);
    }

    set({
      interventionControls: updatedControls,
      activeScenarioImpact: impact,
    });
  },

  resetInterventionControls: () => {
    const { currentForecast } = get();
    const resetControls = { ...DEFAULT_CONTROLS };

    let impact: ScenarioImpact | null = null;
    if (currentForecast) {
      impact = computeScenarioImpact(currentForecast, resetControls);
    }

    set({
      interventionControls: resetControls,
      activeScenarioImpact: impact,
    });
  },

  startInterventionFlight: (targetStationId) => {
    const { currentReadings, selectedStationId } = get();
    // Default to Anand Vihar (high anomaly/AQI station) or currently selected
    const focusId =
      targetStationId ??
      selectedStationId ??
      currentReadings.find((r) => r.aqi.category === 'SEVERE' || r.aqi.category === 'VERY_POOR')
        ?.stationId ??
      'DELHI_ANAND_VIHAR';

    get().selectStation(focusId);
    get().resetInterventionControls();

    set({
      isFlightActive: true,
      activeFlightStep: 1,
    });
  },

  exitInterventionFlight: () => {
    get().resetInterventionControls();
    set({
      isFlightActive: false,
      activeFlightStep: 1,
    });
  },

  setFlightStep: (step) => {
    set({ activeFlightStep: Math.min(5, Math.max(1, step)) });
  },
}));
