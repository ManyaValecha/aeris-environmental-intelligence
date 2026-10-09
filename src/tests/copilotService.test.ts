import { describe, it, expect } from 'vitest';
import { generateCopilotResponse } from '@/services/copilot/copilotService';
import { DeterministicCopilotProvider } from '@/services/copilot/deterministicCopilot';
import type { CopilotContext } from '@/services/copilot/copilotTypes';
import type { StationTelemetry } from '@/types/telemetry';
import type { StationForecast } from '@/types/forecast';
import type { HistoricalPoint } from '@/services/historicalService';
import type { AnomalyRecord } from '@/services/anomalyService';
import type { ScenarioImpact } from '@/types/intervention';

describe('copilotService', () => {
  const mockTelemetry: StationTelemetry = {
    stationId: 'DELHI_ITO',
    timestamp: '2026-10-08T10:00:00Z',
    provenance: 'MEASURED',
    aqi: {
      value: 345,
      category: 'VERY_POOR',
      primaryPollutant: 'pm25',
      categoryColor: '#F59E0B',
    },
    pollutants: {
      pm25: 180,
      pm10: 290,
      no2: 85,
      so2: 18,
      co: 2.1,
      o3: 45,
    },
    weather: {
      temperatureCelsius: 28,
      relativeHumidityPct: 62,
      windSpeedKmH: 4.5,
      windDirectionDeg: 290,
      windDirectionLabel: 'WNW',
    },
  };

  const mockForecast: StationForecast = {
    stationId: 'DELHI_ITO',
    stationName: 'ITO, New Delhi',
    generatedAt: '2026-10-08T10:00:00Z',
    model: {
      modelId: 'xgboost-1h',
      modelName: 'XGBoost',
      version: '1.0.0',
      horizon: '1h',
      evaluatedOn: '2026-10-08',
      testObservationCount: 100,
      metrics: { mae: 14.2, rmse: 18.1, r2: 0.88 },
      limitations: [],
    },
    predictions: {
      '1h': {
        timestamp: '2026-10-08T11:00:00Z',
        horizon: '1h',
        predictedPm25: 192,
        predictedAqi: 355,
        predictedAqiCategory: 'VERY_POOR',
        categoryColor: '#F59E0B',
        lowerBoundPm25: 175,
        upperBoundPm25: 210,
        confidenceLevel: 0.95,
        anomalyFlag: false,
      },
      '6h': {
        timestamp: '2026-10-08T16:00:00Z',
        horizon: '6h',
        predictedPm25: 215,
        predictedAqi: 375,
        predictedAqiCategory: 'VERY_POOR',
        categoryColor: '#F59E0B',
        lowerBoundPm25: 190,
        upperBoundPm25: 240,
        confidenceLevel: 0.95,
        anomalyFlag: false,
      },
      '24h': {
        timestamp: '2026-10-09T10:00:00Z',
        horizon: '24h',
        predictedPm25: 175,
        predictedAqi: 340,
        predictedAqiCategory: 'VERY_POOR',
        categoryColor: '#F59E0B',
        lowerBoundPm25: 140,
        upperBoundPm25: 210,
        confidenceLevel: 0.95,
        anomalyFlag: false,
      },
    },
    provenance: 'PREDICTED',
  };

  const mockHistorical: HistoricalPoint[] = [
    { timestamp: '2026-10-07T10:00:00Z', pm25: 140, pm10: 220, no2: 60, temperature: 26, humidity: 65, windSpeed: 5, provenance: 'REANALYSIS' },
    { timestamp: '2026-10-08T10:00:00Z', pm25: 180, pm10: 290, no2: 85, temperature: 28, humidity: 62, windSpeed: 4.5, provenance: 'REANALYSIS' },
  ];

  const mockAnomalies: AnomalyRecord[] = [
    {
      id: 'anom-1',
      stationId: 'DELHI_ITO',
      stationName: 'ITO, New Delhi',
      timestamp: '2026-10-08T10:00:00Z',
      pollutant: 'pm25',
      observedValue: 180,
      baselineValue: 110,
      anomalyScore: 0.85,
      explanation: 'Unusual spike in PM2.5 detected relative to 7-day rolling baseline.',
      provenance: 'MEASURED',
      severity: 'HIGH',
    },
  ];

  const mockScenario: ScenarioImpact = {
    stationId: 'DELHI_ITO',
    stationName: 'ITO, New Delhi',
    generatedAt: '2026-10-08T10:00:00Z',
    controls: {
      trafficReductionFraction: 0.2,
      constructionReductionFraction: 0.3,
      industrialReductionFraction: 0.1,
    },
    horizons: {
      '1h': { horizon: '1h', baselinePm25: 192, scenarioPm25: 172, absoluteDelta: -20, percentageDelta: -10.4, baselineAqiCategory: 'VERY_POOR', scenarioAqiCategory: 'VERY_POOR', scenarioCategoryColor: '#F59E0B' },
      '6h': { horizon: '6h', baselinePm25: 215, scenarioPm25: 185, absoluteDelta: -30, percentageDelta: -13.95, baselineAqiCategory: 'VERY_POOR', scenarioAqiCategory: 'VERY_POOR', scenarioCategoryColor: '#F59E0B' },
      '24h': { horizon: '24h', baselinePm25: 175, scenarioPm25: 155, absoluteDelta: -20, percentageDelta: -11.4, baselineAqiCategory: 'VERY_POOR', scenarioAqiCategory: 'VERY_POOR', scenarioCategoryColor: '#F59E0B' },
    },
    assumptions: [],
    deterministic_summary: 'Traffic (-20%), Construction (-30%), Industry (-10%) estimated reduction.',
    strongest_horizon: '6h',
    provenance: 'ESTIMATED',
    disclaimer: 'Scenario sensitivity estimate based on empirical sector response factors. Not a causal prediction.',
  };

  it('generates a valid response with all required sections (WHAT, WHY, NEXT, ACTION)', async () => {
    const res = await generateCopilotResponse(
      mockTelemetry,
      mockForecast,
      mockHistorical,
      mockAnomalies,
      'REAL',
      mockScenario
    );

    expect(res.what).toBeDefined();
    expect(res.why).toBeDefined();
    expect(res.next).toBeDefined();
    expect(res.action).toBeDefined();

    expect(res.what.evidence.length).toBeGreaterThan(0);
    expect(res.why.factors.length).toBeGreaterThan(0);
    expect(res.next.forecasts.length).toBe(3);
    expect(res.action.recommendations.length).toBeGreaterThan(0);
  });

  it('preserves provenance on all evidence items and recommendations', async () => {
    const res = await generateCopilotResponse(
      mockTelemetry,
      mockForecast,
      mockHistorical,
      mockAnomalies,
      'REAL',
      mockScenario
    );

    res.what.evidence.forEach(item => {
      expect(['MEASURED', 'REANALYSIS', 'SIMULATED', 'PREDICTED', 'ESTIMATED', 'AI-GENERATED']).toContain(item.provenance);
    });

    res.why.factors.forEach(factor => {
      expect(['MEASURED', 'REANALYSIS', 'SIMULATED', 'PREDICTED', 'ESTIMATED', 'AI-GENERATED']).toContain(factor.provenance);
    });

    res.action.recommendations.forEach(rec => {
      expect(['MEASURED', 'REANALYSIS', 'SIMULATED', 'PREDICTED', 'ESTIMATED', 'AI-GENERATED']).toContain(rec.provenance);
    });
  });

  it('DeterministicCopilotProvider generates deterministic response directly', async () => {
    const provider = new DeterministicCopilotProvider();
    const mockContext: CopilotContext = {
      stationId: 'DELHI_ITO',
      stationName: 'ITO, New Delhi',
      locality: 'Central Delhi',
      dataMode: 'REAL',
      observedAt: '2026-10-08T10:00:00Z',
      pollutants: {
        pm25: 180,
        pm10: 290,
        no2: 85,
        so2: 18,
        co: 2.1,
        o3: 45,
        provenance: 'MEASURED',
      },
      weather: {
        temperatureCelsius: 28,
        relativeHumidityPct: 62,
        windSpeedKmH: 4.5,
        windDirectionLabel: 'WNW',
        provenance: 'REANALYSIS',
      },
      aqiValue: 345,
      aqiCategory: 'VERY_POOR',
      forecasts: {
        '1h': { horizon: '1h', predictedPm25: 192, predictedAqiCategory: 'VERY_POOR', lowerBoundPm25: 175, upperBoundPm25: 210, confidenceLevel: 0.95, modelId: 'xgboost-1h', modelName: 'XGBoost', metrics: { mae: 14.2, rmse: 18.1, r2: 0.88 }, anomalyFlag: false, provenance: 'PREDICTED' },
        '6h': { horizon: '6h', predictedPm25: 215, predictedAqiCategory: 'VERY_POOR', lowerBoundPm25: 190, upperBoundPm25: 240, confidenceLevel: 0.95, modelId: 'lightgbm-6h', modelName: 'LightGBM', metrics: { mae: 21.4, rmse: 28.3, r2: 0.79 }, anomalyFlag: false, provenance: 'PREDICTED' },
        '24h': { horizon: '24h', predictedPm25: 175, predictedAqiCategory: 'VERY_POOR', lowerBoundPm25: 140, upperBoundPm25: 210, confidenceLevel: 0.95, modelId: 'persistence-24h', modelName: 'Persistence Baseline', metrics: { mae: 38.6, rmse: 49.2, r2: 0.52 }, anomalyFlag: false, provenance: 'PREDICTED' },
      },
      activeAnomalies: [],
      historical: null,
      intervention: null,
    };

    const res = await provider.generate(mockContext);
    expect(res.generatedBy).toBe('DETERMINISTIC');
    expect(res.what.evidence.length).toBeGreaterThan(0);
  });
});
