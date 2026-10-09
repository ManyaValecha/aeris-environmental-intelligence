/**
 * AERIS Environmental Copilot — Type Contracts
 *
 * All types are strict. No field is optional unless the value genuinely
 * may be unavailable. Every numeric claim must trace back to a context value.
 */

import type { DataProvenance } from '@/types/provenance';
import type { StationId, AQICategory } from '@/types/telemetry';
import type { ForecastHorizon } from '@/types/forecast';
import type { AnomalyRecord } from '@/services/anomalyService';

// ─── Context ─────────────────────────────────────────────────────────────────
// What we hand to the Copilot. Only data that already exists in the store.

export interface CopilotPollutantContext {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  provenance: DataProvenance;
}

export interface CopilotWeatherContext {
  temperatureCelsius: number;
  relativeHumidityPct: number;
  windSpeedKmH: number;
  windDirectionLabel: string;
  provenance: DataProvenance;
}

export interface CopilotForecastContext {
  horizon: ForecastHorizon;
  predictedPm25: number;
  predictedAqiCategory: AQICategory;
  lowerBoundPm25: number;
  upperBoundPm25: number;
  confidenceLevel: number;
  modelId: string;
  modelName: string;
  metrics: { mae: number; rmse: number; r2: number };
  anomalyFlag: boolean;
  provenance: DataProvenance;   // always 'PREDICTED'
}

export interface CopilotInterventionContext {
  trafficReductionFraction: number;
  constructionReductionFraction: number;
  industrialReductionFraction: number;
  estimatedDelta6hPm25: number;        // negative = improvement, µg/m³
  estimatedDelta6hPct: number;         // relative %, negative = improvement
  estimatedScenarioPm256h: number;
  disclaimer: string;
  provenance: DataProvenance;          // always 'ESTIMATED'
}

export interface CopilotHistoricalContext {
  periodHours: number;
  firstPm25: number;
  lastPm25: number;
  minPm25: number;
  maxPm25: number;
  meanPm25: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
  provenance: DataProvenance;
}

/** The structured AERIS context handed verbatim to the Copilot. */
export interface CopilotContext {
  stationId: StationId;
  stationName: string;
  locality: string;
  dataMode: 'REAL' | 'DEMO';
  observedAt: string;               // ISO timestamp of the observation
  pollutants: CopilotPollutantContext;
  weather: CopilotWeatherContext;
  aqiValue: number;
  aqiCategory: AQICategory;
  forecasts: {
    '1h': CopilotForecastContext;
    '6h': CopilotForecastContext;
    '24h': CopilotForecastContext;
  };
  historical: CopilotHistoricalContext | null;
  activeAnomalies: AnomalyRecord[];
  intervention: CopilotInterventionContext | null;
}

// ─── Response Schema ──────────────────────────────────────────────────────────

export interface Evidence {
  label: string;
  value: string;         // human-readable, never raw float
  unit?: string;
  provenance: DataProvenance;
}

export interface Factor {
  signal: string;        // What was observed
  interpretation: string; // Possible meaning (hedged)
  provenance: DataProvenance;
}

export interface ForecastInsight {
  horizon: ForecastHorizon;
  summary: string;
  predictedPm25: number;
  aqiCategory: AQICategory;
  confidenceNote: string;
  provenance: DataProvenance; // always 'PREDICTED'
}

export interface ActionRecommendation {
  audience: 'CITIZEN' | 'AUTHORITY';
  recommendation: string;
  basis: string;          // Which context value justifies this
  provenance: DataProvenance;
}

export interface ProvenanceReference {
  section: 'WHAT' | 'WHY' | 'NEXT' | 'ACTION' | 'EXPLANATION';
  provenance: DataProvenance;
  description: string;
}

export interface CopilotResponse {
  stationId: StationId;
  stationName: string;
  generatedAt: string;
  what: {
    summary: string;
    evidence: Evidence[];
  };
  why: {
    summary: string;
    factors: Factor[];
  };
  next: {
    summary: string;
    forecasts: ForecastInsight[];
  };
  action: {
    summary: string;
    recommendations: ActionRecommendation[];
  };
  provenanceIndex: ProvenanceReference[];
  generatedBy: 'DETERMINISTIC' | 'BEDROCK';
  disclaimers: string[];
  /** If true, context was built from DEMO/SIMULATED data — make clear in UI */
  isDemoMode: boolean;
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface CopilotProvider {
  readonly id: 'DETERMINISTIC' | 'BEDROCK';
  generate(context: CopilotContext): Promise<CopilotResponse>;
  isAvailable(): Promise<boolean>;
}

// ─── Response Audience Mode ───────────────────────────────────────────────────

export type CopilotAudience = 'CITIZEN' | 'AUTHORITY';
