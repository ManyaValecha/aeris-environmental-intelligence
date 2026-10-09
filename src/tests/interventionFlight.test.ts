import { describe, it, expect, beforeEach } from 'vitest';
import { useAerisStore } from '@/store/aerisStore';
import { buildCopilotContext } from '@/services/copilot/contextBuilder';
import { generateStationForecast } from '@/services/forecastService';
import { getStationHistoricalSeries } from '@/services/historicalService';
import { computeScenarioImpact } from '@/services/interventionService';

const MOCK_TELEMETRY = {
  stationId: 'DELHI_ANAND_VIHAR' as const,
  timestamp: '2026-10-09T12:00:00.000Z',
  provenance: 'MEASURED' as const,
  pollutants: {
    pm25: 285.4,
    pm10: 412.0,
    no2: 88.5,
    so2: 24.1,
    co: 2.8,
    o3: 42.0,
  },
  aqi: {
    value: 365,
    category: 'SEVERE' as const,
    primaryPollutant: 'pm25' as const,
    categoryColor: '#7c3aed',
  },
  weather: {
    temperatureCelsius: 24.5,
    relativeHumidityPct: 65,
    windSpeedKmH: 12.4,
    windDirectionDeg: 295,
    windDirectionLabel: 'WNW',
  },
};

describe('The Intervention Flight Workflow & Grounding', () => {
  beforeEach(() => {
    useAerisStore.setState({
      currentReadings: [MOCK_TELEMETRY],
      selectedStationId: 'DELHI_ANAND_VIHAR',
      interventionControls: {
        trafficReductionFraction: 0.0,
        constructionReductionFraction: 0.0,
        industrialReductionFraction: 0.0,
      },
      activeScenarioImpact: null,
      isFlightActive: false,
      activeFlightStep: 1,
    });
  });

  it('1. Launches Intervention Flight and selects target station correctly', () => {
    const store = useAerisStore.getState();
    store.startInterventionFlight('DELHI_ANAND_VIHAR');

    const updated = useAerisStore.getState();
    expect(updated.isFlightActive).toBe(true);
    expect(updated.selectedStationId).toBe('DELHI_ANAND_VIHAR');
    expect(updated.activeFlightStep).toBe(1);
    expect(updated.currentForecast).not.toBeNull();
  });

  it('2. Updates intervention sliders and computes ESTIMATED scenario impact', () => {
    const store = useAerisStore.getState();
    store.selectStation('DELHI_ANAND_VIHAR');

    // Simulate 30% traffic reduction and 20% construction reduction
    store.updateInterventionControls({
      trafficReductionFraction: 0.30,
      constructionReductionFraction: 0.20,
    });

    const updated = useAerisStore.getState();
    expect(updated.interventionControls.trafficReductionFraction).toBe(0.30);
    expect(updated.interventionControls.constructionReductionFraction).toBe(0.20);
    expect(updated.activeScenarioImpact).not.toBeNull();
    expect(updated.activeScenarioImpact?.provenance).toBe('ESTIMATED');

    const h6 = updated.activeScenarioImpact?.horizons['6h'];
    expect(h6).toBeDefined();
    expect(h6!.absoluteDelta).toBeLessThan(0); // Reduction in PM2.5
    expect(h6!.percentageDelta).toBeLessThan(0);
  });

  it('3. Resets intervention controls to 0.0 cleanly', () => {
    const store = useAerisStore.getState();
    store.selectStation('DELHI_ANAND_VIHAR');
    store.updateInterventionControls({ trafficReductionFraction: 0.40 });

    store.resetInterventionControls();

    const resetState = useAerisStore.getState();
    expect(resetState.interventionControls.trafficReductionFraction).toBe(0);
    expect(resetState.interventionControls.constructionReductionFraction).toBe(0);
    expect(resetState.interventionControls.industrialReductionFraction).toBe(0);

    const h6 = resetState.activeScenarioImpact?.horizons['6h'];
    expect(h6?.absoluteDelta).toBe(0);
  });

  it('4. Grounds Copilot context with active ScenarioImpact values without fabricating numbers', () => {
    const forecast = generateStationForecast(MOCK_TELEMETRY);
    const history = getStationHistoricalSeries('DELHI_ANAND_VIHAR', 24);
    const scenario = computeScenarioImpact(forecast, {
      trafficReductionFraction: 0.30,
      constructionReductionFraction: 0.20,
      industrialReductionFraction: 0.10,
    });

    const context = buildCopilotContext(
      MOCK_TELEMETRY,
      forecast,
      history,
      [],
      'DEMO',
      scenario
    );

    expect(context.intervention).not.toBeNull();
    expect(context.intervention?.trafficReductionFraction).toBe(0.30);
    expect(context.intervention?.provenance).toBe('ESTIMATED');
    expect(context.intervention?.estimatedDelta6hPm25).toBe(scenario.horizons['6h'].absoluteDelta);
    expect(context.intervention?.estimatedDelta6hPct).toBe(scenario.horizons['6h'].percentageDelta);
  });

  it('5. Exits Intervention Flight cleanly', () => {
    const store = useAerisStore.getState();
    store.startInterventionFlight('DELHI_ANAND_VIHAR');
    store.updateInterventionControls({ trafficReductionFraction: 0.25 });

    store.exitInterventionFlight();

    const exitedState = useAerisStore.getState();
    expect(exitedState.isFlightActive).toBe(false);
    expect(exitedState.interventionControls.trafficReductionFraction).toBe(0);
  });
});
