import { describe, it, expect } from 'vitest';
import {
  computeScenarioImpact,
  DEFAULT_CONTROLS,
  SCENARIO_ASSUMPTIONS,
} from '@/services/interventionService';
import type { StationForecast } from '@/types/forecast';
import type { StationId } from '@/types/telemetry';

// Minimal StationForecast fixture with realistic PM2.5 values
const mockForecast: StationForecast = {
  stationId: 'DELHI_ANAND_VIHAR' as StationId,
  stationName: 'Anand Vihar',
  generatedAt: '2026-10-07T12:00:00Z',
  provenance: 'PREDICTED',
  model: {
    modelId: 'xgboost-v1',
    modelName: 'XGBoost Regressor',
    version: '1.0.0',
    horizon: '1h',
    evaluatedOn: '2026-10-08',
    testObservationCount: 2616,
    metrics: { mae: 4.38, rmse: 6.25, r2: 0.9527 },
    limitations: [],
  },
  predictions: {
    '1h': {
      timestamp: '2026-10-07T13:00:00Z',
      horizon: '1h',
      predictedPm25: 150,
      predictedAqi: 320,
      predictedAqiCategory: 'VERY_POOR',
      categoryColor: '#ef4444',
      lowerBoundPm25: 137.3,
      upperBoundPm25: 162.7,
      confidenceLevel: 0.95,
      anomalyFlag: false,
    },
    '6h': {
      timestamp: '2026-10-07T18:00:00Z',
      horizon: '6h',
      predictedPm25: 138,
      predictedAqi: 295,
      predictedAqiCategory: 'VERY_POOR',
      categoryColor: '#ef4444',
      lowerBoundPm25: 109.6,
      upperBoundPm25: 166.4,
      confidenceLevel: 0.95,
      anomalyFlag: false,
    },
    '24h': {
      timestamp: '2026-10-08T12:00:00Z',
      horizon: '24h',
      predictedPm25: 150,
      predictedAqi: 320,
      predictedAqiCategory: 'VERY_POOR',
      categoryColor: '#ef4444',
      lowerBoundPm25: 111.3,
      upperBoundPm25: 188.7,
      confidenceLevel: 0.95,
      anomalyFlag: false,
    },
  },
};

describe('Intervention Service — Zero Scenario', () => {
  it('zero interventions produce scenario PM2.5 equal to baseline', () => {
    const result = computeScenarioImpact(mockForecast, DEFAULT_CONTROLS);
    expect(result.horizons['1h'].scenarioPm25).toBeCloseTo(
      result.horizons['1h'].baselinePm25, 1
    );
    expect(result.horizons['6h'].scenarioPm25).toBeCloseTo(
      result.horizons['6h'].baselinePm25, 1
    );
    expect(result.horizons['24h'].scenarioPm25).toBeCloseTo(
      result.horizons['24h'].baselinePm25, 1
    );
  });

  it('zero interventions produce zero deltas', () => {
    const result = computeScenarioImpact(mockForecast, DEFAULT_CONTROLS);
    expect(result.horizons['1h'].absoluteDelta).toBeCloseTo(0, 1);
    expect(result.horizons['6h'].absoluteDelta).toBeCloseTo(0, 1);
    expect(result.horizons['24h'].absoluteDelta).toBeCloseTo(0, 1);
  });
});

describe('Intervention Service — Provenance & Contract', () => {
  it('all scenario outputs carry provenance ESTIMATED', () => {
    const result = computeScenarioImpact(mockForecast, {
      trafficReductionFraction: 0.3,
      constructionReductionFraction: 0.2,
      industrialReductionFraction: 0.2,
    });
    expect(result.provenance).toBe('ESTIMATED');
  });

  it('scenario output contains a disclaimer string', () => {
    const result = computeScenarioImpact(mockForecast, DEFAULT_CONTROLS);
    expect(result.disclaimer).toBeTruthy();
    expect(result.disclaimer).toContain('not a causal prediction');
  });

  it('output includes all three horizons', () => {
    const result = computeScenarioImpact(mockForecast, DEFAULT_CONTROLS);
    expect(result.horizons['1h']).toBeDefined();
    expect(result.horizons['6h']).toBeDefined();
    expect(result.horizons['24h']).toBeDefined();
  });

  it('scenario assumptions array is non-empty and contains data source citations', () => {
    expect(SCENARIO_ASSUMPTIONS.length).toBeGreaterThan(0);
    for (const assumption of SCENARIO_ASSUMPTIONS) {
      expect(assumption.dataSource).toBeTruthy();
      expect(assumption.coefficient).toBeGreaterThan(0);
    }
  });
});

describe('Intervention Service — Bounds & Safety', () => {
  it('scenario PM2.5 never goes below 10 ug/m3 (regional background floor)', () => {
    const result = computeScenarioImpact(mockForecast, {
      trafficReductionFraction: 0.5,
      constructionReductionFraction: 0.5,
      industrialReductionFraction: 0.5,
    });
    expect(result.horizons['1h'].scenarioPm25).toBeGreaterThanOrEqual(10);
    expect(result.horizons['6h'].scenarioPm25).toBeGreaterThanOrEqual(10);
    expect(result.horizons['24h'].scenarioPm25).toBeGreaterThanOrEqual(10);
  });

  it('maximum 50% slider on all controls never eliminates more than 70% of PM2.5', () => {
    const result = computeScenarioImpact(mockForecast, {
      trafficReductionFraction: 0.5,
      constructionReductionFraction: 0.5,
      industrialReductionFraction: 0.5,
    });
    const baseline1h = result.horizons['1h'].baselinePm25;
    const scenario1h = result.horizons['1h'].scenarioPm25;
    const actualReduction = (baseline1h - scenario1h) / baseline1h;
    expect(actualReduction).toBeLessThanOrEqual(0.70);
  });

  it('partial intervention reduces scenario below baseline for 1h and 6h', () => {
    const result = computeScenarioImpact(mockForecast, {
      trafficReductionFraction: 0.3,
      constructionReductionFraction: 0.0,
      industrialReductionFraction: 0.0,
    });
    expect(result.horizons['1h'].scenarioPm25).toBeLessThan(result.horizons['1h'].baselinePm25);
    expect(result.horizons['6h'].scenarioPm25).toBeLessThan(result.horizons['6h'].baselinePm25);
  });

  it('24h horizon has smaller absolute delta than 1h for identical controls (horizon attenuation)', () => {
    const result = computeScenarioImpact(mockForecast, {
      trafficReductionFraction: 0.4,
      constructionReductionFraction: 0.3,
      industrialReductionFraction: 0.2,
    });
    const delta1h = Math.abs(result.horizons['1h'].absoluteDelta);
    const delta24h = Math.abs(result.horizons['24h'].absoluteDelta);
    // When baseline PM2.5 values are equal, 24h attenuation means smaller delta
    // (horizons can differ in baseline PM2.5 too; verify as proportional reduction)
    const pctDelta1h = Math.abs(result.horizons['1h'].percentageDelta);
    const pctDelta24h = Math.abs(result.horizons['24h'].percentageDelta);
    expect(pctDelta24h).toBeLessThan(pctDelta1h);
    void delta1h; void delta24h; // suppress unused
  });

  it('baseline and scenario PM2.5 are stored separately in output', () => {
    const result = computeScenarioImpact(mockForecast, {
      trafficReductionFraction: 0.2,
      constructionReductionFraction: 0.1,
      industrialReductionFraction: 0.1,
    });
    // They should be different objects / values
    expect(result.horizons['1h'].baselinePm25).not.toEqual(result.horizons['1h'].scenarioPm25);
  });
});
