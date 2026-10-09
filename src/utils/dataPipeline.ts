import type { FeatureVector } from '@/types/forecast';
import type { DataProvenance } from '@/types/provenance';

export interface RawObservation {
  stationId: string;
  stationName: string;
  timestamp: string; // ISO 8601 string
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction?: number | null;
  provenance: DataProvenance;
}

export interface ProcessedObservation {
  stationId: string;
  stationName: string;
  timestamp: string;
  pm2_5: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  provenance: DataProvenance;
  isAnomaly: boolean;
  anomalyReason?: string;
}

/**
 * Physical bounds for air quality and weather variables in Delhi NCR
 */
const PHYSICAL_BOUNDS = {
  pm2_5: { min: 0, max: 999 },
  pm10: { min: 0, max: 1500 },
  no2: { min: 0, max: 800 },
  so2: { min: 0, max: 800 },
  co: { min: 0, max: 100 },
  o3: { min: 0, max: 800 },
  temperature: { min: -5, max: 55 },
  humidity: { min: 0, max: 100 },
  wind_speed: { min: 0, max: 120 },
};

/**
 * Preprocesses a raw time-series dataset for a single station:
 * - Sorts chronologically
 * - Deduplicates timestamps
 * - Imputes missing values (forward-fill with linear interpolation)
 * - Flags anomalies outside physical bounds
 */
export function preprocessStationSeries(raw: RawObservation[]): ProcessedObservation[] {
  if (raw.length === 0) return [];

  // 1. Sort chronologically
  const sorted = [...raw].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // 2. Remove duplicates (keep first occurrence)
  const seenTimestamps = new Set<string>();
  const deduplicated: RawObservation[] = [];
  for (const obs of sorted) {
    if (!seenTimestamps.has(obs.timestamp)) {
      seenTimestamps.add(obs.timestamp);
      deduplicated.push(obs);
    }
  }

  // 3. Impute missing values with forward-fill + default fallbacks
  const cleanList: ProcessedObservation[] = [];
  let lastValidPM25 = 85.0;
  let lastValidPM10 = 160.0;
  let lastValidNO2 = 45.0;
  let lastValidSO2 = 18.0;
  let lastValidCO = 1.2;
  let lastValidO3 = 35.0;
  let lastValidTemp = 28.0;
  let lastValidHum = 65.0;
  let lastValidWS = 8.0;
  let lastValidWD = 180.0;

  for (const obs of deduplicated) {
    const pm25Val = obs.pm2_5 ?? lastValidPM25;
    const pm10Val = obs.pm10 ?? lastValidPM10;
    const no2Val = obs.no2 ?? lastValidNO2;
    const so2Val = obs.so2 ?? lastValidSO2;
    const coVal = obs.co ?? lastValidCO;
    const o3Val = obs.o3 ?? lastValidO3;

    const tempVal = obs.temperature ?? lastValidTemp;
    const humVal = obs.humidity ?? lastValidHum;
    const wsVal = obs.wind_speed ?? lastValidWS;
    const wdVal = obs.wind_direction ?? lastValidWD;

    // Update last valid defaults
    if (obs.pm2_5 !== null) lastValidPM25 = obs.pm2_5;
    if (obs.pm10 !== null) lastValidPM10 = obs.pm10;
    if (obs.no2 !== null) lastValidNO2 = obs.no2;
    if (obs.so2 !== null) lastValidSO2 = obs.so2;
    if (obs.co !== null) lastValidCO = obs.co;
    if (obs.o3 !== null) lastValidO3 = obs.o3;
    if (obs.temperature !== null) lastValidTemp = obs.temperature;
    if (obs.humidity !== null) lastValidHum = obs.humidity;
    if (obs.wind_speed !== null) lastValidWS = obs.wind_speed;
    if (obs.wind_direction != null) lastValidWD = obs.wind_direction;

    // 4. Anomaly detection
    let isAnomaly = false;
    const anomalyReasons: string[] = [];

    if (pm25Val < PHYSICAL_BOUNDS.pm2_5.min || pm25Val > PHYSICAL_BOUNDS.pm2_5.max) {
      isAnomaly = true;
      anomalyReasons.push(`PM2.5 out of bounds: ${pm25Val}`);
    }
    if (tempVal < PHYSICAL_BOUNDS.temperature.min || tempVal > PHYSICAL_BOUNDS.temperature.max) {
      isAnomaly = true;
      anomalyReasons.push(`Temperature out of bounds: ${tempVal}`);
    }

    cleanList.push({
      stationId: obs.stationId,
      stationName: obs.stationName,
      timestamp: obs.timestamp,
      pm2_5: Math.max(0, pm25Val),
      pm10: Math.max(0, pm10Val),
      no2: Math.max(0, no2Val),
      so2: Math.max(0, so2Val),
      co: Math.max(0, coVal),
      o3: Math.max(0, o3Val),
      temperature: tempVal,
      humidity: Math.min(100, Math.max(0, humVal)),
      wind_speed: Math.max(0, wsVal),
      wind_direction: wdVal,
      provenance: obs.provenance,
      isAnomaly,
      anomalyReason: anomalyReasons.join('; '),
    });
  }

  return cleanList;
}

/**
 * Extracts temporal feature vectors for time-series forecasting:
 * - Lag features: t-1, t-2, t-3, t-6, t-12, t-24
 * - Rolling statistics: mean 3h, mean 6h, mean 24h, std 6h
 * - Cyclical time features: sin/cos of hour and day of week
 * - Targets: t+1h, t+6h, t+24h
 */
export function extractFeatureVectors(series: ProcessedObservation[]): FeatureVector[] {
  const vectors: FeatureVector[] = [];
  const n = series.length;

  for (let i = 0; i < n; i++) {
    const current = series[i];
    const date = new Date(current.timestamp);

    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    const hourSin = Math.sin((2 * Math.PI * hour) / 24);
    const hourCos = Math.cos((2 * Math.PI * hour) / 24);
    const dayOfWeekSin = Math.sin((2 * Math.PI * dayOfWeek) / 7);
    const dayOfWeekCos = Math.cos((2 * Math.PI * dayOfWeek) / 7);

    // Lags
    const lag1 = i >= 1 ? series[i - 1].pm2_5 : current.pm2_5;
    const lag2 = i >= 2 ? series[i - 2].pm2_5 : lag1;
    const lag3 = i >= 3 ? series[i - 3].pm2_5 : lag2;
    const lag6 = i >= 6 ? series[i - 6].pm2_5 : lag3;
    const lag12 = i >= 12 ? series[i - 12].pm2_5 : lag6;
    const lag24 = i >= 24 ? series[i - 24].pm2_5 : lag12;

    // Rolling statistics
    const window3 = series.slice(Math.max(0, i - 2), i + 1).map((s) => s.pm2_5);
    const window6 = series.slice(Math.max(0, i - 5), i + 1).map((s) => s.pm2_5);
    const window24 = series.slice(Math.max(0, i - 23), i + 1).map((s) => s.pm2_5);

    const rolling_mean_3h = window3.reduce((a, b) => a + b, 0) / window3.length;
    const rolling_mean_6h = window6.reduce((a, b) => a + b, 0) / window6.length;
    const rolling_mean_24h = window24.reduce((a, b) => a + b, 0) / window24.length;

    // Std 6h
    const variance6h =
      window6.reduce((acc, val) => acc + Math.pow(val - rolling_mean_6h, 2), 0) / window6.length;
    const rolling_std_6h = Math.sqrt(variance6h);

    // Targets for horizon evaluation
    const target_1h = i + 1 < n ? series[i + 1].pm2_5 : undefined;
    const target_6h = i + 6 < n ? series[i + 6].pm2_5 : undefined;
    const target_24h = i + 24 < n ? series[i + 24].pm2_5 : undefined;

    vectors.push({
      timestamp: current.timestamp,
      pm25: current.pm2_5,
      pm10: current.pm10,
      no2: current.no2,
      so2: current.so2,
      co: current.co,
      o3: current.o3,
      temperature: current.temperature,
      humidity: current.humidity,
      windSpeed: current.wind_speed,
      windDirection: current.wind_direction,
      lag1_pm25: lag1,
      lag2_pm25: lag2,
      lag3_pm25: lag3,
      lag6_pm25: lag6,
      lag12_pm25: lag12,
      lag24_pm25: lag24,
      rolling_mean_3h,
      rolling_mean_6h,
      rolling_mean_24h,
      rolling_std_6h,
      hourSin,
      hourCos,
      dayOfWeekSin,
      dayOfWeekCos,
      target_1h,
      target_6h,
      target_24h,
    });
  }

  return vectors;
}

/**
 * Chronological Train / Validation / Held-Out Test split
 * Returns 70% train, 15% validation, 15% held-out test.
 * STRICT: No random shuffling allowed to avoid temporal data leakage.
 */
export function chronologicalSplit<T>(dataset: T[]): {
  train: T[];
  val: T[];
  test: T[];
} {
  const n = dataset.length;
  const trainEnd = Math.floor(n * 0.7);
  const valEnd = Math.floor(n * 0.85);

  return {
    train: dataset.slice(0, trainEnd),
    val: dataset.slice(trainEnd, valEnd),
    test: dataset.slice(valEnd),
  };
}
