
import { getAqiCategory } from "./aqi";
import type { PollutantReadings } from "./aqi";

export type AlertSeverity = "INFO" | "WARNING" | "HIGH" | "CRITICAL";

export interface AerisAlert {
  id: string;
  stationId: string;
  stationName: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  aqi: number;
  category: string;
  pollutantReadings: PollutantReadings;
  provenance: "RULE_BASED";
  createdAt: string;
}

export interface AlertInput {
  stationId: string;
  stationName: string;
  aqi: number | null;
  pollutantReadings: PollutantReadings;
  timestamp?: string;
}

export function generateStationAlert(
  input: AlertInput
): AerisAlert | null {
  const { stationId, stationName, aqi, pollutantReadings } = input;

  if (
    aqi === null ||
    !Number.isFinite(aqi) ||
    aqi < 0 ||
    aqi > 500
  ) {
    return null;
  }

  let severity: AlertSeverity;

  if (aqi >= 401) {
    severity = "CRITICAL";
  } else if (aqi >= 301) {
    severity = "HIGH";
  } else if (aqi >= 201) {
    severity = "WARNING";
  } else if (aqi >= 101) {
    severity = "WARNING";
  } else {
    return null;
  }

  const category = getAqiCategory(aqi);
  const timestamp = input.timestamp ?? new Date().toISOString();

  return {
    id: `${stationId}-${timestamp}-${aqi}`,
    stationId,
    stationName,
    severity,
    title: `${category} air quality at ${stationName}`,
    message:
      `The supplied AQI value is ${aqi} (${category}). ` +
      "Review the latest measurements and applicable local guidance.",
    aqi,
    category,
    pollutantReadings,
    provenance: "RULE_BASED",
    createdAt: timestamp
  };
}
