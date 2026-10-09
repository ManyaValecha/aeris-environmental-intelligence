import { describe, it, expect } from 'vitest';
import {
  preprocessStationSeries,
  extractFeatureVectors,
  chronologicalSplit,
  type RawObservation,
} from '@/utils/dataPipeline';

describe('Data Quality Pipeline', () => {
  const mockRawData: RawObservation[] = [
    {
      stationId: 'site_1',
      stationName: 'Anand Vihar',
      timestamp: '2026-10-01T10:00:00Z',
      pm2_5: 120.0,
      pm10: 220.0,
      no2: 45.0,
      so2: 15.0,
      co: 1.2,
      o3: 30.0,
      temperature: 28.5,
      humidity: 60,
      wind_speed: 10.0,
      wind_direction: 180,
      provenance: 'REANALYSIS',
    },
    // Duplicate timestamp with missing PM2.5
    {
      stationId: 'site_1',
      stationName: 'Anand Vihar',
      timestamp: '2026-10-01T10:00:00Z',
      pm2_5: null,
      pm10: null,
      no2: null,
      so2: null,
      co: null,
      o3: null,
      temperature: null,
      humidity: null,
      wind_speed: null,
      provenance: 'REANALYSIS',
    },
    // Next hour with missing PM2.5 (should forward-fill)
    {
      stationId: 'site_1',
      stationName: 'Anand Vihar',
      timestamp: '2026-10-01T11:00:00Z',
      pm2_5: null,
      pm10: 210.0,
      no2: 40.0,
      so2: 14.0,
      co: 1.1,
      o3: 35.0,
      temperature: 29.0,
      humidity: 58,
      wind_speed: 12.0,
      wind_direction: 190,
      provenance: 'REANALYSIS',
    },
    // Out of bounds anomaly
    {
      stationId: 'site_1',
      stationName: 'Anand Vihar',
      timestamp: '2026-10-01T12:00:00Z',
      pm2_5: 1200.0, // Exceeds 999 max bound
      pm10: 300.0,
      no2: 50.0,
      so2: 20.0,
      co: 2.0,
      o3: 40.0,
      temperature: 30.0,
      humidity: 55,
      wind_speed: 14.0,
      wind_direction: 200,
      provenance: 'REANALYSIS',
    },
  ];

  it('deduplicates timestamps and sorts chronologically', () => {
    const cleaned = preprocessStationSeries(mockRawData);
    expect(cleaned).toHaveLength(3); // 4 raw - 1 duplicate = 3 unique hours
    expect(cleaned[0].timestamp).toBe('2026-10-01T10:00:00Z');
    expect(cleaned[1].timestamp).toBe('2026-10-01T11:00:00Z');
    expect(cleaned[2].timestamp).toBe('2026-10-01T12:00:00Z');
  });

  it('preserves REANALYSIS provenance strictly', () => {
    const cleaned = preprocessStationSeries(mockRawData);
    expect(cleaned[0].provenance).toBe('REANALYSIS');
  });

  it('imputes missing values via forward fill without future leakage', () => {
    const cleaned = preprocessStationSeries(mockRawData);
    // 11:00 record had null pm2_5, should forward fill from 10:00 (120.0)
    expect(cleaned[1].pm2_5).toBe(120.0);
  });

  it('flags physical out-of-bounds anomalies', () => {
    const cleaned = preprocessStationSeries(mockRawData);
    expect(cleaned[2].isAnomaly).toBe(true);
    expect(cleaned[2].anomalyReason).toContain('PM2.5 out of bounds');
  });

  it('extracts lagged and rolling features without error', () => {
    const cleaned = preprocessStationSeries(mockRawData);
    const vectors = extractFeatureVectors(cleaned);
    expect(vectors).toHaveLength(3);
    expect(vectors[0].lag1_pm25).toBe(120.0);
    expect(vectors[1].rolling_mean_3h).toBeCloseTo((120 + 120) / 2);
    expect(vectors[0].hourSin).toBeDefined();
    expect(vectors[0].hourCos).toBeDefined();
  });

  it('splits datasets chronologically without shuffling', () => {
    const dummySeries = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const { train, val, test } = chronologicalSplit(dummySeries);

    expect(train).toHaveLength(70);
    expect(val).toHaveLength(15);
    expect(test).toHaveLength(15);

    // Verify ordering
    expect(train[0].id).toBe(0);
    expect(train[69].id).toBe(69);
    expect(val[0].id).toBe(70);
    expect(test[0].id).toBe(85);
    expect(test[14].id).toBe(99);
  });
});
