import { describe, it, expect } from 'vitest';
import { generateStationForecast } from '@/services/forecastService';
import type { StationTelemetry, StationId } from '@/types/telemetry';

describe('Forecast Service & Schema Verification', () => {
  const mockTelemetry: StationTelemetry = {
    stationId: 'site_1' as StationId,
    timestamp: '2026-10-07T12:00:00.000Z',
    provenance: 'REANALYSIS',
    pollutants: {
      pm25: 150.0,
      pm10: 250.0,
      no2: 45.0,
      so2: 18.0,
      co: 1.2,
      o3: 35.0,
    },
    aqi: {
      value: 323,
      category: 'VERY_POOR',
      categoryColor: '#ef4444',
      primaryPollutant: 'pm25',
    },
    weather: {
      temperatureCelsius: 28.5,
      relativeHumidityPct: 62,
      windSpeedKmH: 12.0,
      windDirectionDeg: 270,
      windDirectionLabel: 'W',
    },
  };

  it('enforces provenance: PREDICTED on all forecast outputs', () => {
    const forecast = generateStationForecast(mockTelemetry);
    expect(forecast.provenance).toBe('PREDICTED');
    expect(forecast.stationId).toBe('site_1');
  });

  it('constructs valid target horizons (1h, 6h, 24h) with target timestamps', () => {
    const forecast = generateStationForecast(mockTelemetry);
    expect(forecast.predictions['1h']).toBeDefined();
    expect(forecast.predictions['6h']).toBeDefined();
    expect(forecast.predictions['24h']).toBeDefined();

    expect(new Date(forecast.predictions['1h'].timestamp).getTime()).toBe(
      new Date('2026-10-07T13:00:00.000Z').getTime()
    );
    expect(new Date(forecast.predictions['6h'].timestamp).getTime()).toBe(
      new Date('2026-10-07T18:00:00.000Z').getTime()
    );
    expect(new Date(forecast.predictions['24h'].timestamp).getTime()).toBe(
      new Date('2026-10-08T12:00:00.000Z').getTime()
    );
  });

  it('calculates valid prediction ranges without uncalibrated confidence claims', () => {
    const forecast = generateStationForecast(mockTelemetry);
    const p1h = forecast.predictions['1h'];

    expect(p1h.lowerBoundPm25).toBeLessThanOrEqual(p1h.predictedPm25);
    expect(p1h.upperBoundPm25).toBeGreaterThanOrEqual(p1h.predictedPm25);
    expect(p1h.confidenceLevel).toBe(0.95);
  });

  it('includes complete empirical model metadata and limitations', () => {
    const forecast = generateStationForecast(mockTelemetry);
    expect(forecast.model.modelId).toBe('xgboost-v1');
    expect(forecast.model.metrics.mae).toBe(4.38);
    expect(forecast.model.metrics.rmse).toBe(6.25);
    expect(forecast.model.limitations.length).toBeGreaterThan(0);
  });
});
