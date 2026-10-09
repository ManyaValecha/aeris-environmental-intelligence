import { describe, it, expect } from 'vitest';
import { getStationHistoricalSeries } from '@/services/historicalService';
import type { StationId } from '@/types/telemetry';

describe('Historical Data Service', () => {
  it('returns valid historical time series for station with provenance', () => {
    const series = getStationHistoricalSeries('DELHI_ANAND_VIHAR' as StationId, 24);
    expect(series.length).toBeGreaterThan(0);
    expect(series[0].provenance).toBeDefined();
    expect(['REANALYSIS', 'SIMULATED']).toContain(series[0].provenance);
  });

  it('handles unknown station ID gracefully', () => {
    const series = getStationHistoricalSeries('site_999' as unknown as StationId, 24);
    expect(series).toHaveLength(0);
  });
});
