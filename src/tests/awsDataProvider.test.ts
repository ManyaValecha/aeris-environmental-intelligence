import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemoDataProvider } from '@/services/api/demoDataProvider';
import { AWSDataProvider } from '@/services/api/awsDataProvider';

describe('DataProvider Abstraction & Fallback Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('DemoDataProvider returns valid stations, telemetry, and history offline', async () => {
    const provider = new DemoDataProvider();
    expect(provider.mode).toBe('DEMO');

    const stations = await provider.getStations();
    expect(stations.length).toBeGreaterThan(0);

    const telemetry = await provider.getLatestStationData('DELHI_ITO');
    expect(telemetry.stationId).toBe('DELHI_ITO');
    expect(telemetry.pollutants.pm25).toBeGreaterThan(0);

    const history = await provider.getHistory('DELHI_ITO', 24);
    expect(history.length).toBeGreaterThan(0);
  });

  it('AWSDataProvider falls back gracefully to DemoDataProvider on network failure', async () => {
    // Mock global fetch to throw a network error
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch (Network Error)'));

    const awsProvider = new AWSDataProvider('https://invalid-api-gateway.amazonaws.com');
    expect(awsProvider.mode).toBe('REAL');

    // Should not throw — fallback kicks in
    const stations = await awsProvider.getStations();
    expect(stations.length).toBeGreaterThan(0);
    expect(awsProvider.degraded).toBe(true);

    const telemetry = await awsProvider.getLatestStationData('DELHI_ITO');
    expect(telemetry.stationId).toBe('DELHI_ITO');

    const history = await awsProvider.getHistory('DELHI_ITO', 24);
    expect(history.length).toBeGreaterThan(0);
  });

  it('AWSDataProvider preserves provenance on telemetry submission', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, message: 'Ingested to DynamoDB' }),
    } as any);

    const awsProvider = new AWSDataProvider('https://api.aeris.internal/prod');
    const res = await awsProvider.submitTelemetry({
      stationId: 'DELHI_ITO',
      timestamp: new Date().toISOString(),
      provenance: 'REANALYSIS',
      pollutants: { pm25: 150, pm10: 250, no2: 70, so2: 15, co: 1.8, o3: 40 },
    });

    expect(res.ok).toBe(true);
    expect(res.provenance).toBe('REANALYSIS');
  });
});
