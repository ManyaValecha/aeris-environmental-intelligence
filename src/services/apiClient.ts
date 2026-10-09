/**
 * AERIS API Client
 *
 * Provides a unified interface for data access that:
 *   1. Reads VITE_DATA_MODE to select REAL or DEMO data source.
 *   2. In DEMO mode, returns deterministic SIMULATED data with zero external calls.
 *   3. In REAL mode, attempts live API fetches with automatic fallback to DEMO data
 *      on network failure — never silently mislabels provenance.
 *
 * All returned records carry explicit DataProvenance tags.
 * Callers must surface the provenance to the user — never suppress it.
 */

import type { ApiResponse, DataMode, StationId, StationTelemetry } from '@/types';
import { getDemoCurrentReadings, getDemoHistoricalSeries } from '@/data/demoData';

// ─── Runtime Configuration ──────────────────────────────────────────────────────

const RAW_MODE = import.meta.env.VITE_DATA_MODE as string | undefined;

/** Active data mode. Defaults to DEMO if VITE_DATA_MODE is unset or invalid. */
export const DATA_MODE: DataMode =
  RAW_MODE === 'REAL' ? 'REAL' : 'DEMO';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

// ─── Response Builder ───────────────────────────────────────────────────────────

function buildResponse<T>(data: T, mode: DataMode, error?: string): ApiResponse<T> {
  return {
    ok: !error,
    dataMode: mode,
    timestamp: new Date().toISOString(),
    data,
    ...(error ? { error } : {}),
  };
}

// ─── Network Fetch Wrapper ──────────────────────────────────────────────────────

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Public API Methods ─────────────────────────────────────────────────────────

/**
 * Fetch current telemetry for all stations.
 *
 * DEMO mode: returns deterministic SIMULATED data immediately.
 * REAL mode: calls the backend API; falls back to SIMULATED on failure.
 */
export async function fetchCurrentReadings(): Promise<ApiResponse<StationTelemetry[]>> {
  if (DATA_MODE === 'DEMO') {
    return buildResponse(getDemoCurrentReadings(), 'DEMO');
  }

  // REAL mode: attempt live API call
  const result = await safeFetch<StationTelemetry[]>(`${API_BASE_URL}/v1/air-quality/current`);
  if (result) {
    return buildResponse(result, 'REAL');
  }

  // Graceful fallback — clearly labelled as DEMO fallback, not MEASURED
  console.warn('[AERIS] Live data fetch failed. Falling back to SIMULATED demo data.');
  return buildResponse(getDemoCurrentReadings(), 'DEMO', 'Live data unavailable — displaying SIMULATED demo data.');
}

/**
 * Fetch 24-hour historical telemetry for a single station.
 *
 * DEMO mode: returns deterministic SIMULATED historical series.
 * REAL mode: calls the backend API; falls back to SIMULATED on failure.
 */
export async function fetchHistoricalSeries(
  stationId: StationId,
  hoursBack = 24
): Promise<ApiResponse<StationTelemetry[]>> {
  if (DATA_MODE === 'DEMO') {
    return buildResponse(getDemoHistoricalSeries(stationId, hoursBack), 'DEMO');
  }

  const result = await safeFetch<StationTelemetry[]>(
    `${API_BASE_URL}/v1/air-quality/history?stationId=${stationId}&hoursBack=${hoursBack}`
  );
  if (result) {
    return buildResponse(result, 'REAL');
  }

  console.warn('[AERIS] Historical data fetch failed. Falling back to SIMULATED demo data.');
  return buildResponse(
    getDemoHistoricalSeries(stationId, hoursBack),
    'DEMO',
    'Live historical data unavailable — displaying SIMULATED demo data.'
  );
}
