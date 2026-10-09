import { create } from 'zustand';
import type { DataMode, StationId, StationTelemetry } from '@/types';
import type { StationForecast } from '@/types/forecast';
import { DELHI_NCR_STATIONS } from '@/data/stations';
import { fetchCurrentReadings, DATA_MODE } from '@/services/apiClient';
import { generateStationForecast } from '@/services/forecastService';
import { getStationHistoricalSeries, type HistoricalPoint } from '@/services/historicalService';
import { detectAnomalies, type AnomalyRecord } from '@/services/anomalyService';

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

  // ─── Async / Loading State ──────────────────────────────────────────────────
  isLoading: boolean;
  fetchError: string | null;

  // ─── Actions ────────────────────────────────────────────────────────────────
  refreshReadings: () => Promise<void>;
  selectStation: (id: StationId | null) => void;
}

export const useAerisStore = create<AerisState>((set, get) => ({
  dataMode: DATA_MODE,
  currentReadings: [],
  selectedStationId: DELHI_NCR_STATIONS[0]?.id ?? null,
  lastUpdated: null,

  currentForecast: null,
  historicalSeries: [],
  activeAnomalies: [],

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

      // Update forecast & historical intelligence for selected station
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
      });
      return;
    }

    const { currentReadings } = get();
    const stationTelemetry = currentReadings.find((r) => r.stationId === id);

    let forecast: StationForecast | null = null;
    if (stationTelemetry) {
      forecast = generateStationForecast(stationTelemetry);
    }

    // Historical series (24h)
    const history = getStationHistoricalSeries(id, 24);

    // Compute anomalies
    const stationObj = DELHI_NCR_STATIONS.find((s) => s.id === id);
    const anomalies = detectAnomalies(
      id,
      stationObj?.name ?? id,
      history.map((h) => ({ timestamp: h.timestamp, pm25: h.pm25, provenance: h.provenance }))
    );

    set({
      selectedStationId: id,
      currentForecast: forecast,
      historicalSeries: history,
      activeAnomalies: anomalies,
    });
  },
}));
