export type ProvenanceLabel =
  | 'MEASURED'
  | 'REANALYSIS'
  | 'SIMULATED'
  | 'PREDICTED'
  | 'ESTIMATED'
  | 'AI-GENERATED';

export type AqiCategory =
  | 'GOOD'
  | 'SATISFACTORY'
  | 'MODERATE'
  | 'POOR'
  | 'VERY_POOR'
  | 'SEVERE';

export type UserLens = 'CITIZEN' | 'AUTHORITY';

export interface StationCoordinates {
  lat: number;
  lng: number;
}

export interface Station {
  id: string;
  name: string;
  locality: string;
  coordinates: StationCoordinates;
  openAqId: string;
  description: string;
  dominantSources: string[];
}

export interface PollutantValues {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface WeatherValues {
  temperatureCelsius: number;
  relativeHumidityPct: number;
  windSpeedKmH: number;
  windDirectionDeg: number;
  windDirectionLabel: string;
  pblMixingHeightM: number; // Planetary Boundary Layer height in meters (ERA5 reanalysis)
  thermalInversionStatus: string; // e.g. "SURFACE INVERSION DETECTED (+2.8°C)"
  verticalDispersionIndex: number; // 0 - 100
  verticalDispersionRating: 'OPTIMAL' | 'MODERATE' | 'POOR' | 'CRITICAL_STAGNATION';
}

export interface AqiResult {
  value: number;
  category: AqiCategory;
  primaryPollutant: keyof PollutantValues;
  categoryColor: string;
  healthAdvisory: string;
  dataSufficiencyMet: boolean;
  criteriaPollutantCount: number;
  hasParticulate: boolean;
}

export interface StationReading {
  stationId: string;
  timestamp: string;
  provenance: ProvenanceLabel;
  pollutants: PollutantValues;
  aqi: AqiResult;
  weather: WeatherValues;
}

export type ForecastHorizon = 'NOW' | '1h' | '6h' | '24h';

export interface HorizonPrediction {
  timestamp: string;
  horizon: ForecastHorizon;
  modelName: string;
  predictedPm25: number;
  predictedPm10: number;
  predictedAqi: number;
  predictedAqiCategory: AqiCategory;
  categoryColor: string;
  lowerBoundPm25: number;
  upperBoundPm25: number;
  lowerBoundPm10: number;
  upperBoundPm10: number;
  rmse: number;
  r2: number;
  confidenceLevel: number;
  anomalyFlag: boolean;
  anomalyScore: number;
  provenance: ProvenanceLabel;
  quantileObjective: string;
}

export interface ForecastModelMetadata {
  modelId: string;
  modelName: string;
  version: string;
  horizon: ForecastHorizon;
  evaluatedOn: string;
  testObservationCount: number;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
  };
  limitations: string[];
}

export interface StationForecast {
  stationId: string;
  stationName: string;
  generatedAt: string;
  provenance: ProvenanceLabel;
  model: ForecastModelMetadata;
  predictions: Record<ForecastHorizon, HorizonPrediction>;
}

export interface HistoricalObservation {
  timestamp: string;
  pm25: number;
  pm10: number;
  no2: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pblHeight: number;
  provenance: ProvenanceLabel;
}

export interface Anomaly {
  id: string;
  stationId: string;
  stationName: string;
  timestamp: string;
  pollutant: string;
  observedValue: number;
  baselineValue: number;
  anomalyScore: number; // Isolation Forest anomaly score s in [0, 1]
  isolationPathLength: number; // Average tree depth h(x)
  anomalyType: 'AIRSHED_SURGE' | 'SENSOR_ANOMALY' | 'MULTIVARIATE_OUTLIER';
  method: 'ISOLATION_FOREST' | 'MAD';
  explanation: string;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  provenance: ProvenanceLabel;
  contributingFactors: string[];
}

export interface InterventionControls {
  trafficReductionFraction: number; // 0 to 0.50 (0% to 50%)
  constructionReductionFraction: number; // 0 to 0.50
  industrialReductionFraction: number; // 0 to 0.50
}

export interface HorizonScenarioImpact {
  horizon: ForecastHorizon;
  baselinePm25: number;
  scenarioPm25: number;
  absoluteDelta: number;
  percentageDelta: number;
  baselineAqiCategory: AqiCategory;
  scenarioAqiCategory: AqiCategory;
  scenarioCategoryColor: string;
}

export interface ScenarioAssumption {
  variable: string;
  name: string;
  description: string;
  coefficient: number;
  dataSource: string;
}

export interface ScenarioResult {
  stationId: string;
  stationName: string;
  generatedAt: string;
  controls: InterventionControls;
  horizons: Record<ForecastHorizon, HorizonScenarioImpact>;
  assumptions: ScenarioAssumption[];
  deterministic_summary: string;
  strongest_horizon: ForecastHorizon;
  provenance: ProvenanceLabel;
  disclaimer: string;
}

export interface ProvenanceAuditItem {
  id: string;
  badge: string;
  label: ProvenanceLabel;
  title: string;
  source: string;
  frequency: string;
  processingPipeline: string;
  validationMethod: string;
  confidenceScore: string;
}

export interface CopilotBrief {
  mode: UserLens;
  stationName: string;
  timestamp: string;
  provenance: ProvenanceLabel;
  modelId: string;
  modelFamily: string;
  whatIsHappening: string;
  whyElevated: string;
  whatComesNext: string;
  whatActionToConsider: string;
  executiveSummary: string;
  evidenceSummary?: string;
  userQuestion?: string;
  userAnswer?: string;
  groundTruthFacts: string[];
  actionDirectives: string[];
  grapStageRecommendation: string;
  modelNotice: string;
}
