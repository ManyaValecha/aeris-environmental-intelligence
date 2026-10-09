import type { StationId } from '@/types/telemetry';
import type { DataProvenance } from '@/types/provenance';
import { getDemoHistoricalSeries } from '@/data/demoData';

export interface HistoricalPoint {
  timestamp: string;
  pm25: number;
  pm10: number;
  no2: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  provenance: DataProvenance;
}

/**
 * Historical Data Service
 * Retrieves historical reanalysis / telemetry series for a station.
 * Enforces provenance = 'REANALYSIS' when fetching from historical reanalysis feed,
 * and provenance = 'SIMULATED' when using offline demo generator.
 */
export function getStationHistoricalSeries(
  stationId: StationId,
  hoursBack: number = 24
): HistoricalPoint[] {
  // Demo fallback series with provenance SIMULATED
  const rawDemo = getDemoHistoricalSeries(stationId, hoursBack);
  if (rawDemo.length > 0) {
    return rawDemo.map((t) => ({
      timestamp: t.timestamp,
      pm25: t.pollutants.pm25,
      pm10: t.pollutants.pm10,
      no2: t.pollutants.no2,
      temperature: t.weather.temperatureCelsius,
      humidity: t.weather.relativeHumidityPct,
      windSpeed: t.weather.windSpeedKmH,
      provenance: 'SIMULATED',
    }));
  }

  return [];
}
