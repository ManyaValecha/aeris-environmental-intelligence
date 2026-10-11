
import type { PollutantReadings, Pollutant } from "./aqi";

export type ForecastHorizon = 1 | 6 | 24;

export interface ForecastPoint {
  stationId: string;
  pollutant: Pollutant;
  horizonHours: ForecastHorizon;
  value: number;
  unit: "µg/m³" | "mg/m³";
  provenance: "SIMULATED";
  model: "AERIS-DemoBaseline-v1";
  generatedAt: string;
}

const HORIZONS: ForecastHorizon[] = [1, 6, 24];

const POLLUTANTS: Pollutant[] = [
  "pm25",
  "pm10",
  "no2",
  "so2",
  "co",
  "o3"
];

const UNITS: Record<Pollutant, "µg/m³" | "mg/m³"> = {
  pm25: "µg/m³",
  pm10: "µg/m³",
  no2: "µg/m³",
  so2: "µg/m³",
  co: "mg/m³",
  o3: "µg/m³"
};

/**
 * Creates demo-only scenarios from the latest readings.
 * Replace this function with a validated forecasting model
 * before labelling outputs as PREDICTED.
 */
export function generateDemoForecast(
  stationId: string,
  readings: PollutantReadings,
  generatedAt = new Date().toISOString()
): ForecastPoint[] {
  const forecasts: ForecastPoint[] = [];

  for (const pollutant of POLLUTANTS) {
    const baseline = readings[pollutant];

    if (
      typeof baseline !== "number" ||
      !Number.isFinite(baseline) ||
      baseline < 0
    ) {
      continue;
    }

    for (const horizonHours of HORIZONS) {
      // Deterministic illustrative scenario, not a trained prediction.
      const scenarioFactor =
        1 + 0.08 * Math.sin(horizonHours / 6);

      forecasts.push({
        stationId,
        pollutant,
        horizonHours,
        value: Number((baseline * scenarioFactor).toFixed(2)),
        unit: UNITS[pollutant],
        provenance: "SIMULATED",
        model: "AERIS-DemoBaseline-v1",
        generatedAt
      });
    }
  }

  return forecasts;
}
