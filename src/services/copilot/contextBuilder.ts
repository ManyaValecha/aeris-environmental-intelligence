/**
 * AERIS Copilot Context Builder
 *
 * Assembles a CopilotContext from existing AERIS store state.
 * The context is the ONLY source of truth available to the Copilot.
 * No external data is fetched here; no values are invented.
 */

import type { StationTelemetry } from '@/types/telemetry';
import type { StationForecast } from '@/types/forecast';
import type { AnomalyRecord } from '@/services/anomalyService';
import type { HistoricalPoint } from '@/services/historicalService';
import type { ScenarioImpact } from '@/types/intervention';
import type {
  CopilotContext,
  CopilotForecastContext,
  CopilotHistoricalContext,
  CopilotInterventionContext,
} from './copilotTypes';
import { STATION_MAP } from '@/data/stations';
import type { DataMode } from '@/types/telemetry';

function buildHistoricalContext(
  series: HistoricalPoint[]
): CopilotHistoricalContext | null {
  if (series.length < 2) return null;

  const values = series.map((p) => p.pm25);
  const firstPm25 = values[0];
  const lastPm25 = values[values.length - 1];
  const minPm25 = Math.min(...values);
  const maxPm25 = Math.max(...values);
  const meanPm25 = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;

  const delta = lastPm25 - firstPm25;
  const trend: CopilotHistoricalContext['trend'] =
    delta > 10 ? 'RISING' : delta < -10 ? 'FALLING' : 'STABLE';

  return {
    periodHours: series.length,
    firstPm25: Math.round(firstPm25 * 10) / 10,
    lastPm25: Math.round(lastPm25 * 10) / 10,
    minPm25: Math.round(minPm25 * 10) / 10,
    maxPm25: Math.round(maxPm25 * 10) / 10,
    meanPm25,
    trend,
    provenance: series[0].provenance,
  };
}

function buildForecastContext(
  forecast: StationForecast,
  horizon: '1h' | '6h' | '24h'
): CopilotForecastContext {
  const pt = forecast.predictions[horizon];
  const model = forecast.model;

  return {
    horizon,
    predictedPm25: pt.predictedPm25,
    predictedAqiCategory: pt.predictedAqiCategory as CopilotForecastContext['predictedAqiCategory'],
    lowerBoundPm25: pt.lowerBoundPm25,
    upperBoundPm25: pt.upperBoundPm25,
    confidenceLevel: pt.confidenceLevel,
    modelId: model.modelId,
    modelName: model.modelName,
    metrics: { ...model.metrics },
    anomalyFlag: pt.anomalyFlag,
    provenance: 'PREDICTED',
  };
}

function buildInterventionContext(
  scenario: ScenarioImpact
): CopilotInterventionContext {
  const h6 = scenario.horizons['6h'];
  return {
    trafficReductionFraction: scenario.controls.trafficReductionFraction,
    constructionReductionFraction: scenario.controls.constructionReductionFraction,
    industrialReductionFraction: scenario.controls.industrialReductionFraction,
    estimatedDelta6hPm25: h6.absoluteDelta,
    estimatedDelta6hPct: h6.percentageDelta,
    estimatedScenarioPm256h: h6.scenarioPm25,
    disclaimer: scenario.disclaimer,
    provenance: 'ESTIMATED',
  };
}

/**
 * Assembles a CopilotContext from the current AERIS store snapshot.
 * Only data that exists in the store is included. Nothing is invented.
 *
 * @param telemetry — current telemetry observation for selected station
 * @param forecast  — current ML forecast for selected station
 * @param historical — last N hours of reanalysis/demo history
 * @param anomalies — anomaly records detected by anomalyService
 * @param scenario  — optional scenario impact from interventionService
 * @param dataMode  — REAL or DEMO
 */
export function buildCopilotContext(
  telemetry: StationTelemetry,
  forecast: StationForecast,
  historical: HistoricalPoint[],
  anomalies: AnomalyRecord[],
  dataMode: DataMode,
  scenario: ScenarioImpact | null = null
): CopilotContext {
  const station = STATION_MAP.get(telemetry.stationId);

  return {
    stationId: telemetry.stationId,
    stationName: station?.name ?? telemetry.stationId,
    locality: station?.locality ?? '',
    dataMode,
    observedAt: telemetry.timestamp,
    pollutants: {
      pm25: telemetry.pollutants.pm25,
      pm10: telemetry.pollutants.pm10,
      no2: telemetry.pollutants.no2,
      so2: telemetry.pollutants.so2,
      co: telemetry.pollutants.co,
      o3: telemetry.pollutants.o3,
      provenance: telemetry.provenance,
    },
    weather: {
      temperatureCelsius: telemetry.weather.temperatureCelsius,
      relativeHumidityPct: telemetry.weather.relativeHumidityPct,
      windSpeedKmH: telemetry.weather.windSpeedKmH,
      windDirectionLabel: telemetry.weather.windDirectionLabel,
      provenance: telemetry.provenance,
    },
    aqiValue: telemetry.aqi.value,
    aqiCategory: telemetry.aqi.category,
    forecasts: {
      '1h': buildForecastContext(forecast, '1h'),
      '6h': buildForecastContext(forecast, '6h'),
      '24h': buildForecastContext(forecast, '24h'),
    },
    historical: buildHistoricalContext(historical),
    activeAnomalies: anomalies,
    intervention: scenario ? buildInterventionContext(scenario) : null,
  };
}
