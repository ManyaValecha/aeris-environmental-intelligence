import type { DataProvenance } from './provenance';

// ─── Geographic Types ───────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

// ─── Station Registry ───────────────────────────────────────────────────────────

/** Static registry entry for a Delhi NCR monitoring station. */
export interface Station {
  id: StationId;
  name: string;
  locality: string;
  coordinates: Coordinates;
  /** OpenAQ location ID, if known. */
  openAqId?: string;
}

/** All recognized Delhi NCR station identifiers. */
export type StationId =
  | 'DELHI_ANAND_VIHAR'
  | 'DELHI_ITO'
  | 'DELHI_RK_PURAM'
  | 'DELHI_DWARKA'
  | 'DELHI_PUNJABI_BAGH'
  | 'DELHI_BAWANA'
  | 'NOIDA'
  | 'GURUGRAM';

// ─── Pollutant Readings ─────────────────────────────────────────────────────────

/**
 * Raw pollutant concentrations in standard units.
 * Units: PM2.5 µg/m³, PM10 µg/m³, NO2 µg/m³, SO2 µg/m³, CO mg/m³, O3 µg/m³.
 */
export interface PollutantConcentrations {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

// ─── Weather Context ────────────────────────────────────────────────────────────

export interface WeatherContext {
  temperatureCelsius: number;
  relativeHumidityPct: number;
  windSpeedKmH: number;
  /** Meteorological convention: degrees from north, clockwise. */
  windDirectionDeg: number;
  /** Descriptive label, derived from windDirectionDeg. */
  windDirectionLabel: string;
}

// ─── AQI ────────────────────────────────────────────────────────────────────────

/** Indian National AQI (NAQI) breakpoint categories. */
export type AQICategory =
  | 'GOOD'
  | 'SATISFACTORY'
  | 'MODERATE'
  | 'POOR'
  | 'VERY_POOR'
  | 'SEVERE';

export interface AQIResult {
  value: number;
  category: AQICategory;
  primaryPollutant: keyof PollutantConcentrations;
  categoryColor: string; // CSS hex color for UI rendering
}

// ─── Station Telemetry ──────────────────────────────────────────────────────────

/**
 * A single timestamped observation record for one station.
 * `provenance` MUST be set by the data source — never default to MEASURED.
 */
export interface StationTelemetry {
  stationId: StationId;
  timestamp: string; // ISO 8601
  provenance: DataProvenance;
  pollutants: PollutantConcentrations;
  aqi: AQIResult;
  weather: WeatherContext;
}

// ─── Application Data Mode ──────────────────────────────────────────────────────

/** The two top-level operating modes of AERIS. */
export type DataMode = 'REAL' | 'DEMO';

// ─── API Response Wrapper ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  dataMode: DataMode;
  timestamp: string;
  data: T;
  error?: string;
}
