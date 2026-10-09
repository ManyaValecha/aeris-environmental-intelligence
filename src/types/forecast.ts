import type { StationId } from './telemetry';
import type { DataProvenance } from './provenance';

export type ForecastHorizon = '1h' | '6h' | '24h';

export interface ModelMetadata {
  modelId: string;            // e.g. 'persistence-v1', 'ridge-v1', 'lightgbm-v1'
  modelName: string;          // e.g. 'Persistence Baseline', 'Ridge Regression'
  version: string;            // e.g. '1.0.0'
  horizon: ForecastHorizon;
  evaluatedOn: string;        // Date ISO string
  testObservationCount: number;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
  };
  limitations: string[];
}

export interface PredictionPoint {
  timestamp: string;          // ISO string target timestamp
  horizon: ForecastHorizon;
  predictedPm25: number;
  predictedAqi: number;
  predictedAqiCategory: string;
  categoryColor: string;
  lowerBoundPm25: number;     // Statistical confidence interval lower bound
  upperBoundPm25: number;     // Statistical confidence interval upper bound
  confidenceLevel: number;    // e.g. 0.95 (95%)
  anomalyFlag: boolean;
  anomalyScore?: number;
}

export interface StationForecast {
  stationId: StationId;
  stationName: string;
  generatedAt: string;        // IST timestamp
  provenance: DataProvenance; // Always 'PREDICTED' for forecasts
  model: ModelMetadata;
  predictions: {
    '1h': PredictionPoint;
    '6h': PredictionPoint;
    '24h': PredictionPoint;
  };
}

export interface FeatureVector {
  timestamp: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  // Lags
  lag1_pm25?: number;
  lag2_pm25?: number;
  lag3_pm25?: number;
  lag6_pm25?: number;
  lag12_pm25?: number;
  lag24_pm25?: number;
  // Rolling stats
  rolling_mean_3h?: number;
  rolling_mean_6h?: number;
  rolling_mean_24h?: number;
  rolling_std_6h?: number;
  // Cyclical time features
  hourSin: number;
  hourCos: number;
  dayOfWeekSin: number;
  dayOfWeekCos: number;
  // Target values for training/eval
  target_1h?: number;
  target_6h?: number;
  target_24h?: number;
}
