/**
 * Deterministic Demo Dataset for AERIS
 *
 * ALL data in this file MUST be tagged provenance: 'SIMULATED'.
 * These values are synthetic, illustrative scenario data created for offline
 * demonstration purposes. They are NOT measured air quality readings.
 *
 * Methodology:
 *   Values are manually curated to represent plausible but fictional pollution
 *   scenarios for Delhi NCR stations — modelling a high-pollution autumn day.
 *   They are NOT derived from or representative of any actual historical measurement.
 *
 * The demo dataset is designed to exercise the full range of AQI categories
 * so that all UI states (Good → Severe) can be demonstrated without live data.
 */

import type { StationId, StationTelemetry } from '@/types';
import { calculateAQI } from '@/utils/aqiCalculator';
import { bearingToCompassLabel } from '@/utils/formatters';

interface SimulatedReading {
  stationId: StationId;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
  };
  weather: {
    temperatureCelsius: number;
    relativeHumidityPct: number;
    windSpeedKmH: number;
    windDirectionDeg: number;
  };
}

/**
 * Base scenario readings — these are the t=0 anchor values for each station.
 * Deliberately varied to span multiple AQI categories.
 */
const DEMO_BASE_READINGS: SimulatedReading[] = [
  {
    stationId: 'DELHI_ANAND_VIHAR',
    // Scenario: High-traffic / industrial corridor, poor ventilation
    pollutants: { pm25: 182, pm10: 308, no2: 88, so2: 28, co: 3.2, o3: 35 },
    weather: { temperatureCelsius: 26.5, relativeHumidityPct: 70, windSpeedKmH: 3.8, windDirectionDeg: 290 },
  },
  {
    stationId: 'DELHI_ITO',
    // Scenario: Dense traffic corridor, moderate pollution
    pollutants: { pm25: 135, pm10: 240, no2: 72, so2: 18, co: 2.4, o3: 42 },
    weather: { temperatureCelsius: 27.0, relativeHumidityPct: 65, windSpeedKmH: 5.2, windDirectionDeg: 310 },
  },
  {
    stationId: 'DELHI_RK_PURAM',
    // Scenario: Residential, moderate
    pollutants: { pm25: 95, pm10: 175, no2: 52, so2: 12, co: 1.6, o3: 48 },
    weather: { temperatureCelsius: 27.8, relativeHumidityPct: 58, windSpeedKmH: 7.1, windDirectionDeg: 320 },
  },
  {
    stationId: 'DELHI_DWARKA',
    // Scenario: Residential suburb, satisfactory
    pollutants: { pm25: 55, pm10: 100, no2: 38, so2: 9, co: 1.1, o3: 55 },
    weather: { temperatureCelsius: 28.2, relativeHumidityPct: 54, windSpeedKmH: 8.4, windDirectionDeg: 335 },
  },
  {
    stationId: 'DELHI_PUNJABI_BAGH',
    // Scenario: Mix of traffic and residential
    pollutants: { pm25: 118, pm10: 210, no2: 65, so2: 15, co: 2.0, o3: 45 },
    weather: { temperatureCelsius: 27.3, relativeHumidityPct: 62, windSpeedKmH: 5.8, windDirectionDeg: 305 },
  },
  {
    stationId: 'DELHI_BAWANA',
    // Scenario: Industrial zone — highest pollution in this scenario
    pollutants: { pm25: 248, pm10: 412, no2: 105, so2: 55, co: 4.8, o3: 28 },
    weather: { temperatureCelsius: 25.8, relativeHumidityPct: 75, windSpeedKmH: 2.6, windDirectionDeg: 270 },
  },
  {
    stationId: 'NOIDA',
    // Scenario: Mixed, moderate-poor
    pollutants: { pm25: 148, pm10: 265, no2: 68, so2: 20, co: 2.2, o3: 38 },
    weather: { temperatureCelsius: 26.8, relativeHumidityPct: 67, windSpeedKmH: 4.5, windDirectionDeg: 295 },
  },
  {
    stationId: 'GURUGRAM',
    // Scenario: Tech corridor, moderate
    pollutants: { pm25: 88, pm10: 162, no2: 48, so2: 11, co: 1.4, o3: 52 },
    weather: { temperatureCelsius: 28.5, relativeHumidityPct: 55, windSpeedKmH: 6.8, windDirectionDeg: 330 },
  },
];

/**
 * Build a StationTelemetry record from a SimulatedReading.
 * Provenance is hardcoded to 'SIMULATED' — this cannot be overridden.
 */
function buildTelemetry(reading: SimulatedReading, timestampISO: string): StationTelemetry {
  const aqi = calculateAQI(reading.pollutants);
  return {
    stationId: reading.stationId,
    timestamp: timestampISO,
    provenance: 'SIMULATED', // MUST remain SIMULATED — these are not real measurements
    pollutants: reading.pollutants,
    aqi,
    weather: {
      ...reading.weather,
      windDirectionLabel: bearingToCompassLabel(reading.weather.windDirectionDeg),
    },
  };
}

/**
 * Returns current-time snapshot telemetry for all 8 stations.
 * The timestamp reflects the time this function was called, but all data
 * is clearly provenance: SIMULATED.
 */
export function getDemoCurrentReadings(): StationTelemetry[] {
  const now = new Date().toISOString();
  return DEMO_BASE_READINGS.map((r) => buildTelemetry(r, now));
}

/**
 * Returns a simulated 24-hour historical series for a single station.
 * Applies simple sinusoidal variation to model diurnal pollution patterns:
 *   - Higher PM2.5 during morning rush (07:00–10:00 IST) and evening (18:00–21:00 IST)
 *   - Lower values overnight and midday
 *
 * All values are SIMULATED and are mathematical transformations of the base reading.
 * They do NOT represent actual historical measurements.
 *
 * @param stationId - Target station
 * @param hoursBack  - Number of historical hours to generate (default: 24)
 */
export function getDemoHistoricalSeries(
  stationId: StationId,
  hoursBack = 24
): StationTelemetry[] {
  const baseReading = DEMO_BASE_READINGS.find((r) => r.stationId === stationId);
  if (!baseReading) return [];

  const series: StationTelemetry[] = [];
  const now = Date.now();

  for (let h = hoursBack; h >= 0; h--) {
    const tsMs = now - h * 60 * 60 * 1000;
    const ts = new Date(tsMs).toISOString();

    // IST hour (UTC+5.5) for diurnal pattern
    const istHour = (new Date(tsMs).getUTCHours() + 5.5) % 24;

    // Diurnal multiplier: peaks at rush hours, lower at night/midday
    const diurnalFactor = 1.0
      + 0.35 * Math.exp(-Math.pow(istHour - 8.5, 2) / 8)    // morning peak
      + 0.30 * Math.exp(-Math.pow(istHour - 19.5, 2) / 8)   // evening peak
      - 0.20 * Math.exp(-Math.pow(istHour - 14.0, 2) / 12); // midday dip

    const scale = Math.max(0.6, Math.min(1.5, diurnalFactor));

    const scaled = {
      pm25: Math.round(baseReading.pollutants.pm25 * scale),
      pm10: Math.round(baseReading.pollutants.pm10 * scale),
      no2: Math.round(baseReading.pollutants.no2 * scale),
      so2: Math.round(baseReading.pollutants.so2 * scale),
      co: Math.round(baseReading.pollutants.co * scale * 10) / 10,
      o3: Math.round(baseReading.pollutants.o3 * (2 - scale)), // O3 inversely correlated with NOx
    };

    series.push(buildTelemetry({ ...baseReading, pollutants: scaled }, ts));
  }

  return series;
}
