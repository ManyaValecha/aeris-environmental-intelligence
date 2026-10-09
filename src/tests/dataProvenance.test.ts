/**
 * Data Provenance Enforcement Tests
 *
 * These tests verify the AERIS provenance contract:
 *
 *   1. All demo/offline data is tagged SIMULATED — never MEASURED.
 *   2. The getDemoCurrentReadings() function produces valid StationTelemetry records.
 *   3. The getDemoHistoricalSeries() produces chronologically ordered data.
 *   4. No demo record contains a provenance value of MEASURED or PREDICTED.
 *
 * This test suite is a contract test — it protects against future regressions
 * that might incorrectly label synthetic data as real measurements.
 */

import { describe, it, expect } from 'vitest';
import { getDemoCurrentReadings, getDemoHistoricalSeries } from '@/data/demoData';
import { DELHI_NCR_STATIONS } from '@/data/stations';
import type { StationId } from '@/types';

// ─── getDemoCurrentReadings ──────────────────────────────────────────────────────

describe('getDemoCurrentReadings — provenance contract', () => {
  const readings = getDemoCurrentReadings();

  it('returns 8 readings (one per Delhi NCR station)', () => {
    expect(readings).toHaveLength(8);
  });

  it('every reading has provenance: SIMULATED', () => {
    for (const reading of readings) {
      expect(reading.provenance).toBe('SIMULATED');
    }
  });

  it('no reading has provenance: MEASURED', () => {
    const measured = readings.filter((r) => r.provenance === 'MEASURED');
    expect(measured).toHaveLength(0);
  });

  it('no reading has provenance: REANALYSIS', () => {
    const reanalysis = readings.filter((r) => r.provenance === 'REANALYSIS');
    expect(reanalysis).toHaveLength(0);
  });

  it('no reading has provenance: PREDICTED', () => {
    const predicted = readings.filter((r) => r.provenance === 'PREDICTED');
    expect(predicted).toHaveLength(0);
  });

  it('no reading has provenance: ESTIMATED', () => {
    const estimated = readings.filter((r) => r.provenance === 'ESTIMATED');
    expect(estimated).toHaveLength(0);
  });

  it('every reading has a valid stationId', () => {
    const validIds = new Set(DELHI_NCR_STATIONS.map((s) => s.id));
    for (const reading of readings) {
      expect(validIds).toContain(reading.stationId);
    }
  });

  it('every reading has a valid ISO 8601 timestamp', () => {
    for (const reading of readings) {
      expect(new Date(reading.timestamp).toString()).not.toBe('Invalid Date');
    }
  });

  it('every reading has a non-null AQI value > 0', () => {
    for (const reading of readings) {
      expect(reading.aqi.value).toBeGreaterThan(0);
    }
  });

  it('every reading has non-negative pollutant concentrations', () => {
    for (const reading of readings) {
      expect(reading.pollutants.pm25).toBeGreaterThanOrEqual(0);
      expect(reading.pollutants.pm10).toBeGreaterThanOrEqual(0);
      expect(reading.pollutants.no2).toBeGreaterThanOrEqual(0);
      expect(reading.pollutants.so2).toBeGreaterThanOrEqual(0);
      expect(reading.pollutants.co).toBeGreaterThanOrEqual(0);
      expect(reading.pollutants.o3).toBeGreaterThanOrEqual(0);
    }
  });

  it('every reading has a windDirectionLabel (non-empty string)', () => {
    for (const reading of readings) {
      expect(typeof reading.weather.windDirectionLabel).toBe('string');
      expect(reading.weather.windDirectionLabel.length).toBeGreaterThan(0);
    }
  });
});

// ─── getDemoHistoricalSeries ─────────────────────────────────────────────────────

describe('getDemoHistoricalSeries — provenance contract', () => {
  const stationId: StationId = 'DELHI_ANAND_VIHAR';
  const series = getDemoHistoricalSeries(stationId, 24);

  it('returns 25 entries for hoursBack=24 (inclusive of t=0)', () => {
    // 24 hours back + current = 25 readings
    expect(series).toHaveLength(25);
  });

  it('every entry is provenance: SIMULATED', () => {
    for (const entry of series) {
      expect(entry.provenance).toBe('SIMULATED');
    }
  });

  it('no entry is provenance: MEASURED', () => {
    const measured = series.filter((e) => e.provenance === 'MEASURED');
    expect(measured).toHaveLength(0);
  });

  it('all entries belong to the requested station', () => {
    for (const entry of series) {
      expect(entry.stationId).toBe(stationId);
    }
  });

  it('timestamps are in ascending chronological order', () => {
    for (let i = 1; i < series.length; i++) {
      const prev = new Date(series[i - 1].timestamp).getTime();
      const curr = new Date(series[i].timestamp).getTime();
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it('returns empty array for unknown stationId', () => {
    const result = getDemoHistoricalSeries('UNKNOWN_STATION' as StationId, 24);
    expect(result).toHaveLength(0);
  });

  it('PM2.5 values are > 0 for all time steps', () => {
    for (const entry of series) {
      expect(entry.pollutants.pm25).toBeGreaterThan(0);
    }
  });
});

// ─── Station registry completeness ──────────────────────────────────────────────

describe('DELHI_NCR_STATIONS registry', () => {
  it('contains exactly 8 stations', () => {
    expect(DELHI_NCR_STATIONS).toHaveLength(8);
  });

  it('all station IDs are unique', () => {
    const ids = DELHI_NCR_STATIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all stations have valid coordinates in Delhi NCR bounding box', () => {
    // Approximate bounding box: lat 28.0–29.0, lng 76.5–77.8
    for (const station of DELHI_NCR_STATIONS) {
      expect(station.coordinates.lat).toBeGreaterThan(28.0);
      expect(station.coordinates.lat).toBeLessThan(29.0);
      expect(station.coordinates.lng).toBeGreaterThan(76.5);
      expect(station.coordinates.lng).toBeLessThan(77.8);
    }
  });
});
