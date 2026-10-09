import { describe, it, expect } from 'vitest';
import { detectAnomalies } from '@/services/anomalyService';
import type { StationId } from '@/types/telemetry';

describe('Anomaly Detection Service', () => {
  const stationId = 'site_1' as StationId;

  const normalSeries = Array.from({ length: 24 }, (_, i) => ({
    timestamp: `2026-10-07T${String(i).padStart(2, '0')}:00:00Z`,
    pm25: 100 + Math.sin(i / 3) * 10, // Normal diurnal oscillation around 100
    provenance: 'REANALYSIS' as const,
  }));

  it('returns zero anomalies for normal diurnal oscillation', () => {
    const anomalies = detectAnomalies(stationId, 'Anand Vihar', normalSeries);
    expect(anomalies).toHaveLength(0);
  });

  it('detects a rapid PM2.5 rate-of-change surge (+55 ug/m3 in 1 hour)', () => {
    const surgeSeries = [...normalSeries];
    surgeSeries[12] = {
      timestamp: '2026-10-07T12:00:00Z',
      pm25: 165.0, // Surge of +55 ug/m3 in 1 hour
      provenance: 'REANALYSIS' as const,
    };

    const anomalies = detectAnomalies(stationId, 'Anand Vihar', surgeSeries);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].pollutant).toBe('pm25');
    expect(anomalies[0].explanation).toContain('Rapid PM2.5 spike');
    expect(anomalies[0].provenance).toBe('REANALYSIS');
  });

  it('handles empty or short time series gracefully', () => {
    expect(detectAnomalies(stationId, 'Anand Vihar', [])).toHaveLength(0);
    expect(detectAnomalies(stationId, 'Anand Vihar', [normalSeries[0]])).toHaveLength(0);
  });
});
