/**
 * AERIS Intervention Scenario Simulator — Type Contracts
 *
 * All scenario results carry provenance = 'ESTIMATED'.
 * Language must say "Scenario sensitivity estimate — not a causal prediction."
 */

import type { ForecastHorizon } from './forecast';

export interface InterventionControls {
  /** Traffic emission reduction fraction: 0.0–0.50 (0–50%) */
  trafficReductionFraction: number;
  /** Construction dust activity reduction fraction: 0.0–0.50 */
  constructionReductionFraction: number;
  /** Industrial combustion activity reduction fraction: 0.0–0.50 */
  industrialReductionFraction: number;
}

export interface ScenarioAssumption {
  variable: string;
  description: string;
  coefficient: number;
  dataSource: string;
}

export interface HorizonImpact {
  horizon: ForecastHorizon;
  baselinePm25: number;
  scenarioPm25: number;
  absoluteDelta: number;         // scenario - baseline (negative = improvement)
  percentageDelta: number;       // relative to baseline
  baselineAqiCategory: string;
  scenarioAqiCategory: string;
  scenarioCategoryColor: string;
}

export interface ScenarioImpact {
  stationId: string;
  stationName: string;
  generatedAt: string;
  controls: InterventionControls;
  horizons: Record<ForecastHorizon, HorizonImpact>;
  assumptions: ScenarioAssumption[];
  deterministic_summary: string;
  strongest_horizon: ForecastHorizon;
  provenance: 'ESTIMATED';
  disclaimer: string;
}
