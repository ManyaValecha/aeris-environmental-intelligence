/**
 * AERIS Deterministic Copilot
 *
 * Generates structured environmental intelligence from AERIS context using
 * rule-based logic. ALL numeric values are taken from the supplied context —
 * never computed here, never invented.
 *
 * This provider works offline, without Bedrock, and is the guaranteed fallback.
 * Output is deterministic: the same context produces the same response.
 *
 * Scientific language discipline:
 * - "observed in the available data" / "recorded"
 * - "the forecast estimates" / "projected"
 * - "the scenario simulator estimates" — never "will reduce"
 * - "possible contributing factors" / "signals that may be associated with"
 * - Never turns correlation into causation.
 */

import type {
  CopilotContext,
  CopilotResponse,
  CopilotProvider,
  Evidence,
  Factor,
  ForecastInsight,
  ActionRecommendation,
  ProvenanceReference,
} from './copilotTypes';

// ─── AQI category helpers ─────────────────────────────────────────────────────

function aqiLabel(cat: string): string {
  const MAP: Record<string, string> = {
    GOOD: 'Good',
    SATISFACTORY: 'Satisfactory',
    MODERATE: 'Moderate',
    POOR: 'Poor',
    VERY_POOR: 'Very Poor',
    SEVERE: 'Severe',
  };
  return MAP[cat] ?? cat;
}

function isAqiHigh(cat: string): boolean {
  return cat === 'POOR' || cat === 'VERY_POOR' || cat === 'SEVERE';
}

function isAqiSevere(cat: string): boolean {
  return cat === 'SEVERE';
}

function forecastDirectionPhrase(current: number, predicted: number): string {
  const delta = predicted - current;
  if (delta > 20) return 'significantly increasing PM2.5 risk';
  if (delta > 5)  return 'moderately increasing PM2.5 risk';
  if (delta < -20) return 'substantially improving air quality';
  if (delta < -5)  return 'moderately improving air quality';
  return 'broadly stable conditions';
}

// ─── WHAT Section ─────────────────────────────────────────────────────────────

function buildWhat(ctx: CopilotContext): CopilotResponse['what'] {
  const { pollutants, weather, aqiCategory, aqiValue, historical } = ctx;
  const trendNote = historical
    ? `The recent ${historical.periodHours}-hour reanalysis window shows a ${historical.trend.toLowerCase()} trajectory (range: ${historical.minPm25}–${historical.maxPm25} µg/m³).`
    : '';

  const summary =
    `PM2.5 is currently recorded at ${pollutants.pm25} µg/m³ (AQI ${aqiValue}, ${aqiLabel(aqiCategory)}) at ${ctx.stationName}. ` +
    `PM10 is ${pollutants.pm10} µg/m³, NO₂ is ${pollutants.no2} µg/m³. ` +
    (trendNote ? trendNote : '');

  const evidence: Evidence[] = [
    {
      label: 'PM2.5',
      value: String(pollutants.pm25),
      unit: 'µg/m³',
      provenance: pollutants.provenance,
    },
    {
      label: 'PM10',
      value: String(pollutants.pm10),
      unit: 'µg/m³',
      provenance: pollutants.provenance,
    },
    {
      label: 'NO₂',
      value: String(pollutants.no2),
      unit: 'µg/m³',
      provenance: pollutants.provenance,
    },
    {
      label: 'SO₂',
      value: String(pollutants.so2),
      unit: 'µg/m³',
      provenance: pollutants.provenance,
    },
    {
      label: 'CO',
      value: String(pollutants.co),
      unit: 'mg/m³',
      provenance: pollutants.provenance,
    },
    {
      label: 'AQI',
      value: String(aqiValue),
      unit: '',
      provenance: pollutants.provenance,
    },
    {
      label: 'Wind',
      value: `${weather.windSpeedKmH} km/h ${weather.windDirectionLabel}`,
      provenance: weather.provenance,
    },
    {
      label: 'Humidity',
      value: `${weather.relativeHumidityPct}%`,
      provenance: weather.provenance,
    },
    {
      label: 'Temperature',
      value: `${weather.temperatureCelsius}°C`,
      provenance: weather.provenance,
    },
  ];

  if (historical) {
    evidence.push({
      label: `${historical.periodHours}h Trend`,
      value: historical.trend,
      provenance: historical.provenance,
    });
  }

  return { summary: summary.trim(), evidence };
}

// ─── WHY Section ─────────────────────────────────────────────────────────────

function buildWhy(ctx: CopilotContext): CopilotResponse['why'] {
  const { pollutants, weather, aqiCategory, historical, activeAnomalies } = ctx;
  const factors: Factor[] = [];

  // PM10 vs PM2.5 ratio — dust signature
  if (pollutants.pm10 > 0) {
    const ratio = pollutants.pm25 / pollutants.pm10;
    if (ratio > 0.75) {
      factors.push({
        signal: `PM2.5/PM10 ratio is ${(ratio).toFixed(2)} (above 0.75)`,
        interpretation:
          'A high PM2.5/PM10 ratio may be associated with fine combustion particles rather than coarse dust. Possible contributing factors include vehicle exhaust or biomass burning emissions.',
        provenance: pollutants.provenance,
      });
    } else {
      factors.push({
        signal: `PM2.5/PM10 ratio is ${(ratio).toFixed(2)} (below 0.75)`,
        interpretation:
          'A lower PM2.5/PM10 ratio may be associated with coarse crustal dust or road dust suspension as a proportionally significant component.',
        provenance: pollutants.provenance,
      });
    }
  }

  // Wind speed — ventilation
  if (weather.windSpeedKmH < 5) {
    factors.push({
      signal: `Low wind speed recorded at ${weather.windSpeedKmH} km/h`,
      interpretation:
        'Calm or near-calm wind conditions are associated with reduced atmospheric dispersion. Pollutants may accumulate locally under such conditions.',
      provenance: weather.provenance,
    });
  } else if (weather.windSpeedKmH > 20) {
    factors.push({
      signal: `Elevated wind speed recorded at ${weather.windSpeedKmH} km/h`,
      interpretation:
        'Higher wind speeds are associated with improved atmospheric dispersion, which may aid pollutant dilution from the immediate monitoring area.',
      provenance: weather.provenance,
    });
  }

  // Humidity — hygroscopic growth
  if (weather.relativeHumidityPct > 70 && isAqiHigh(aqiCategory)) {
    factors.push({
      signal: `Relative humidity is ${weather.relativeHumidityPct}%`,
      interpretation:
        'High ambient humidity is associated with hygroscopic growth of fine particles, which can increase PM2.5 mass concentrations and suppress visibility.',
      provenance: weather.provenance,
    });
  }

  // NO2 — traffic/combustion signal
  if (pollutants.no2 > 60) {
    factors.push({
      signal: `NO₂ recorded at ${pollutants.no2} µg/m³`,
      interpretation:
        'Elevated NO₂ is a signal associated with traffic and combustion sources. This may contribute to secondary particulate formation over longer timescales.',
      provenance: pollutants.provenance,
    });
  }

  // Historical trend
  if (historical?.trend === 'RISING') {
    factors.push({
      signal: `PM2.5 trend is rising over the last ${historical.periodHours} hours (from ${historical.firstPm25} to ${historical.lastPm25} µg/m³)`,
      interpretation:
        'A sustained rising trend in the reanalysis data may indicate accumulation driven by continued emissions or weakening dispersion conditions.',
      provenance: historical.provenance,
    });
  } else if (historical?.trend === 'FALLING') {
    factors.push({
      signal: `PM2.5 trend is falling over the last ${historical.periodHours} hours (from ${historical.firstPm25} to ${historical.lastPm25} µg/m³)`,
      interpretation:
        'A falling reanalysis trend may reflect improving meteorological conditions, reduced emission activity, or wind-driven dilution.',
      provenance: historical.provenance,
    });
  }

  // Active anomalies
  for (const anomaly of activeAnomalies.slice(0, 2)) {
    factors.push({
      signal: `Statistical anomaly detected: ${anomaly.explanation}`,
      interpretation:
        'This anomaly represents a statistically significant deviation from the recent rolling baseline. Possible contributing factors include episodic emission events or rapid meteorological changes.',
      provenance: anomaly.provenance || pollutants.provenance,
    });
  }

  // Fallback if no factors found
  if (factors.length === 0) {
    factors.push({
      signal: 'No significant anomalous signals detected in available data',
      interpretation:
        'Current conditions appear consistent with the recent observed baseline. Available data do not show statistically significant deviations.',
      provenance: pollutants.provenance,
    });
  }

  const summary =
    `Available data show ${factors.length} signal(s) that may be associated with the current air quality pattern at ${ctx.stationName}. ` +
    `Note: these are observational associations — correlation is not causation.`;

  return { summary, factors };
}

// ─── NEXT Section ─────────────────────────────────────────────────────────────

function buildNext(ctx: CopilotContext): CopilotResponse['next'] {
  const { forecasts, pollutants } = ctx;
  const forecastList: ForecastInsight[] = [];

  for (const horizon of ['1h', '6h', '24h'] as const) {
    const f = forecasts[horizon];
    const direction = forecastDirectionPhrase(pollutants.pm25, f.predictedPm25);
    const rmseNote = `Model test-set RMSE: ±${f.metrics.rmse} µg/m³`;

    forecastList.push({
      horizon,
      summary:
        `The ${horizon} forecast (${f.modelName}) estimates ${f.predictedPm25} µg/m³ (${aqiLabel(f.predictedAqiCategory)}), ` +
        `indicating ${direction}. 95% prediction range: ${f.lowerBoundPm25}–${f.upperBoundPm25} µg/m³. ${rmseNote}.`,
      predictedPm25: f.predictedPm25,
      aqiCategory: f.predictedAqiCategory,
      confidenceNote: `${Math.round(f.confidenceLevel * 100)}% statistical interval. ${rmseNote}.`,
      provenance: 'PREDICTED',
    });
  }

  const worst = forecastList.reduce((a, b) =>
    b.predictedPm25 > a.predictedPm25 ? b : a
  );

  const summary =
    `The empirical forecast models project ${forecastList[0].predictedPm25} µg/m³ at 1h, ` +
    `${forecastList[1].predictedPm25} µg/m³ at 6h, and ${forecastList[2].predictedPm25} µg/m³ at 24h. ` +
    `The highest projected concentrations appear at the ${worst.horizon} horizon (${aqiLabel(worst.aqiCategory)}).`;

  return { summary, forecasts: forecastList };
}

// ─── ACTION Section ───────────────────────────────────────────────────────────

function buildAction(ctx: CopilotContext): CopilotResponse['action'] {
  const { intervention, forecasts, aqiCategory } = ctx;
  const recommendations: ActionRecommendation[] = [];
  const forecast6h = forecasts['6h'];

  // Citizen recommendations based on AQI
  if (isAqiSevere(aqiCategory)) {
    recommendations.push({
      audience: 'CITIZEN',
      recommendation:
        'Avoid all outdoor exertion. Keep windows closed. Wear certified particulate filtration masks if outdoor exposure is unavoidable.',
      basis: `AQI category is ${aqiLabel(aqiCategory)} with PM2.5 at ${ctx.pollutants.pm25} µg/m³.`,
      provenance: ctx.pollutants.provenance,
    });
  } else if (isAqiHigh(aqiCategory)) {
    recommendations.push({
      audience: 'CITIZEN',
      recommendation:
        'Limit prolonged outdoor physical activity. Vulnerable groups (children, elderly, respiratory/cardiac conditions) should remain indoors.',
      basis: `AQI category is ${aqiLabel(aqiCategory)} with PM2.5 at ${ctx.pollutants.pm25} µg/m³.`,
      provenance: ctx.pollutants.provenance,
    });
  } else {
    recommendations.push({
      audience: 'CITIZEN',
      recommendation:
        'Current air quality allows normal outdoor activity for most. Monitor updates as conditions may change.',
      basis: `AQI is ${aqiLabel(aqiCategory)} (PM2.5: ${ctx.pollutants.pm25} µg/m³).`,
      provenance: ctx.pollutants.provenance,
    });
  }

  // Authority forecast-based recommendation
  if (isAqiHigh(forecast6h.predictedAqiCategory)) {
    recommendations.push({
      audience: 'AUTHORITY',
      recommendation:
        `The 6-hour forecast projects ${forecast6h.predictedPm25} µg/m³ (${aqiLabel(forecast6h.predictedAqiCategory)}). ` +
        'Consider readying public health advisory for sensitive group notifications if sustained above threshold.',
      basis: `Empirical model (${forecast6h.modelName}) 6h prediction with RMSE ±${forecast6h.metrics.rmse} µg/m³.`,
      provenance: 'PREDICTED',
    });
  }

  // Intervention-based recommendation (if scenario is configured)
  if (intervention) {
    const hasIntervention =
      intervention.trafficReductionFraction > 0 ||
      intervention.constructionReductionFraction > 0 ||
      intervention.industrialReductionFraction > 0;

    if (hasIntervention && intervention.estimatedDelta6hPm25 < 0) {
      const pct = Math.abs(intervention.estimatedDelta6hPct);
      const delta = Math.abs(intervention.estimatedDelta6hPm25);
      recommendations.push({
        audience: 'AUTHORITY',
        recommendation:
          `Under the selected intervention scenario assumptions, the simulator estimates a ${delta} µg/m³ ` +
          `(${pct}%) reduction in 6-hour projected PM2.5 (from ${forecast6h.predictedPm25} to ${intervention.estimatedScenarioPm256h} µg/m³). ` +
          'This is a sensitivity estimate based on literature-informed source fractions — not a causal atmospheric model outcome.',
        basis: intervention.disclaimer,
        provenance: 'ESTIMATED',
      });
    } else if (hasIntervention) {
      recommendations.push({
        audience: 'AUTHORITY',
        recommendation:
          'The configured intervention scenario estimates minimal measurable change in projected PM2.5 under current conditions.',
        basis: intervention.disclaimer,
        provenance: 'ESTIMATED',
      });
    }
  }

  const summary =
    recommendations.length > 0
      ? `${recommendations.length} recommendation(s) generated based on current observations and forecast projections.`
      : 'No specific action recommendations generated for current conditions.';

  return { summary, recommendations };
}

// ─── Provenance Index ─────────────────────────────────────────────────────────

function buildProvenanceIndex(ctx: CopilotContext): ProvenanceReference[] {
  const refs: ProvenanceReference[] = [
    {
      section: 'WHAT',
      provenance: ctx.pollutants.provenance,
      description: 'Pollutant observations and AQI',
    },
    {
      section: 'WHY',
      provenance: ctx.pollutants.provenance,
      description: 'Meteorological and emission signals',
    },
    {
      section: 'NEXT',
      provenance: 'PREDICTED',
      description: 'ML empirical forecast model outputs',
    },
  ];

  if (ctx.intervention) {
    refs.push({
      section: 'ACTION',
      provenance: 'ESTIMATED',
      description: 'Intervention scenario sensitivity model output',
    });
  }

  refs.push({
    section: 'EXPLANATION',
    provenance: 'DETERMINISTIC' as unknown as 'AI_GENERATED',
    description: 'Rule-based intelligence — no LLM involved',
  });

  return refs;
}

// ─── Provider Implementation ──────────────────────────────────────────────────

export class DeterministicCopilotProvider implements CopilotProvider {
  readonly id = 'DETERMINISTIC' as const;

  async isAvailable(): Promise<boolean> {
    return true; // Always available — pure in-process computation
  }

  async generate(ctx: CopilotContext): Promise<CopilotResponse> {
    const disclaimers = [
      'This intelligence brief is generated by deterministic rules applied to AERIS structured data. No large language model is involved.',
      'Observational signals are drawn from reanalysis/simulated data — not direct ground-station measurements unless labelled MEASURED.',
      'Forecast values are model predictions with quantified uncertainty. They are not guarantees of future conditions.',
      'Intervention scenario outputs are sensitivity estimates, not causal atmospheric model predictions.',
    ];

    return {
      stationId: ctx.stationId,
      stationName: ctx.stationName,
      generatedAt: new Date().toISOString(),
      what: buildWhat(ctx),
      why: buildWhy(ctx),
      next: buildNext(ctx),
      action: buildAction(ctx),
      provenanceIndex: buildProvenanceIndex(ctx),
      generatedBy: 'DETERMINISTIC',
      disclaimers,
      isDemoMode: ctx.dataMode === 'DEMO',
    };
  }
}
