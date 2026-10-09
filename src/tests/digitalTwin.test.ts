import { describe, it, expect, beforeEach } from 'vitest';
import { useAerisStore } from '@/store/aerisStore';
import { buildCopilotContext } from '@/services/copilot/contextBuilder';
import { generateStationForecast } from '@/services/forecastService';
import { getStationHistoricalSeries } from '@/services/historicalService';

const MOCK_TELEMETRY = {
  stationId: 'DELHI_ANAND_VIHAR' as const,
  timestamp: '2026-10-09T12:00:00.000Z',
  provenance: 'MEASURED' as const,
  pollutants: { pm25: 285.4, pm10: 412.0, no2: 88.5, so2: 24.1, co: 2.8, o3: 42.0 },
  aqi: { value: 365, category: 'SEVERE' as const, primaryPollutant: 'pm25' as const, categoryColor: '#7c3aed' },
  weather: { temperatureCelsius: 24.5, relativeHumidityPct: 65, windSpeedKmH: 12.4, windDirectionDeg: 290, windDirectionLabel: 'WNW' },
};

describe('Atmospheric Digital Twin Integration Suite', () => {
  beforeEach(() => {
    useAerisStore.setState({
      currentReadings: [MOCK_TELEMETRY],
      selectedStationId: 'DELHI_ANAND_VIHAR',
      selectedHorizon: '6h',
      isFlightActive: false,
    });
  });

  it('1. Updates selected forecast horizon in store correctly', () => {
    const store = useAerisStore.getState();
    expect(store.selectedHorizon).toBe('6h');

    store.setSelectedHorizon('24h');
    expect(useAerisStore.getState().selectedHorizon).toBe('24h');

    store.setSelectedHorizon('1h');
    expect(useAerisStore.getState().selectedHorizon).toBe('1h');
  });

  it('2. Maintains explicit provenance and uncertainty labels on ML forecasts', () => {
    const forecast = generateStationForecast(MOCK_TELEMETRY);
    expect(forecast.stationId).toBe('DELHI_ANAND_VIHAR');

    const h1 = forecast.predictions['1h'];
    const h6 = forecast.predictions['6h'];
    const h24 = forecast.predictions['24h'];

    expect(h1.lowerBoundPm25).toBeLessThan(h1.predictedPm25);
    expect(h1.upperBoundPm25).toBeGreaterThan(h1.predictedPm25);
    expect(h6.lowerBoundPm25).toBeLessThan(h6.predictedPm25);
    expect(h24.upperBoundPm25).toBeGreaterThan(h24.predictedPm25);
  });

  it('3. Verifies Copilot context grounds selected station and forecast correctly', () => {
    const forecast = generateStationForecast(MOCK_TELEMETRY);
    const history = getStationHistoricalSeries('DELHI_ANAND_VIHAR', 24);

    const context = buildCopilotContext(MOCK_TELEMETRY, forecast, history, [], 'DEMO');

    expect(context.stationId).toBe('DELHI_ANAND_VIHAR');
    expect(context.pollutants.pm25).toBe(285.4);
    expect(context.forecasts['1h'].predictedPm25).toBe(forecast.predictions['1h'].predictedPm25);
    expect(context.forecasts['6h'].predictedPm25).toBe(forecast.predictions['6h'].predictedPm25);
    expect(context.forecasts['24h'].predictedPm25).toBe(forecast.predictions['24h'].predictedPm25);
  });
});
