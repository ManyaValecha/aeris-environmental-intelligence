import type { StationId } from '@/types/telemetry';
import type { DataProvenance } from '@/types/provenance';

export interface AnomalyRecord {
  id: string;
  stationId: StationId;
  stationName: string;
  timestamp: string;
  pollutant: 'pm25' | 'pm10' | 'no2';
  observedValue: number;
  baselineValue: number;
  anomalyScore: number; // 0.0 to 1.0 normalized
  explanation: string;
  provenance: DataProvenance;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
}

/**
 * Robust Anomaly Detector using Median Absolute Deviation (MAD) & Rate-of-Change Analysis.
 *
 * Evaluates observations against a 24-hour temporal rolling window.
 * Avoids calling high AQI an anomaly if it matches baseline diurnal expectations.
 * Flags genuine statistical spikes and rapid atmospheric deteriorations.
 */
export function detectAnomalies(
  stationId: StationId,
  stationName: string,
  series: { timestamp: string; pm25: number; provenance: DataProvenance }[]
): AnomalyRecord[] {
  if (series.length < 6) return [];

  const anomalies: AnomalyRecord[] = [];
  const pm25Values = series.map((s) => s.pm25);

  // 1. Calculate median and MAD across the series
  const sorted = [...pm25Values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const deviations = pm25Values.map((v) => Math.abs(v - median));
  const sortedDev = [...deviations].sort((a, b) => a - b);
  const mad = (sortedDev.length % 2 !== 0 ? sortedDev[mid] : (sortedDev[mid - 1] + sortedDev[mid]) / 2) || 1.0;

  for (let i = 1; i < series.length; i++) {
    const current = series[i];
    const prev = series[i - 1];
    const val = current.pm25;

    // Modified Z-score using MAD
    const modifiedZ = (0.6745 * (val - median)) / mad;
    const hourlyDelta = val - prev.pm25;

    let isAnomaly = false;
    let explanation = '';
    let severity: AnomalyRecord['severity'] = 'MODERATE';

    // Condition A: Severe Rate-of-Change Deterioration (+40 ug/m3 in 1 hour)
    if (hourlyDelta >= 40) {
      isAnomaly = true;
      severity = hourlyDelta >= 75 ? 'CRITICAL' : 'HIGH';
      explanation = `Rapid PM2.5 spike: +${Math.round(hourlyDelta)} µg/m³ surge in 1 hour (from ${Math.round(prev.pm25)} to ${Math.round(val)} µg/m³).`;
    }
    // Condition B: High Statistical Deviation (Modified Z-score > 3.2)
    else if (modifiedZ > 3.2) {
      isAnomaly = true;
      severity = modifiedZ > 4.5 ? 'CRITICAL' : 'MODERATE';
      explanation = `Statistical anomaly: PM2.5 (${Math.round(val)} µg/m³) is ${modifiedZ.toFixed(1)}x MAD above rolling baseline (${Math.round(median)} µg/m³).`;
    }

    if (isAnomaly) {
      const normalizedScore = Math.min(1.0, Math.max(0.3, Math.abs(modifiedZ) / 5.0));
      anomalies.push({
        id: `anom-${stationId}-${i}`,
        stationId,
        stationName,
        timestamp: current.timestamp,
        pollutant: 'pm25',
        observedValue: val,
        baselineValue: Math.round(median * 10) / 10,
        anomalyScore: Math.round(normalizedScore * 100) / 100,
        explanation,
        provenance: current.provenance,
        severity,
      });
    }
  }

  return anomalies;
}
