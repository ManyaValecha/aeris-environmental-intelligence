/**
 * Indian National Air Quality Index (NAQI) calculator.
 *
 * Reference: CPCB India - National Air Quality Index, 2014.
 * https://cpcb.nic.in/displaypdf.php?id=bmFxaS9OQVFJLnBkZg==
 *
 * Sub-Index formula:
 *   SI = ((IHi - ILo) / (BPHi - BPLo)) * (Cp - BPLo) + ILo
 *
 * Where:
 *   Cp    = Ambient concentration of pollutant
 *   BPHi  = Concentration breakpoint ≥ Cp
 *   BPLo  = Concentration breakpoint ≤ Cp
 *   IHi   = AQI value corresponding to BPHi
 *   ILo   = AQI value corresponding to BPLo
 *
 * Final AQI = max sub-index across all available pollutants.
 */

import type { AQICategory, AQIResult, PollutantConcentrations } from '@/types';

// ─── Breakpoint Tables ──────────────────────────────────────────────────────────

interface Breakpoint {
  cLo: number; // Concentration low
  cHi: number; // Concentration high
  iLo: number; // AQI index low
  iHi: number; // AQI index high
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLo: 0, cHi: 30, iLo: 0, iHi: 50 },
  { cLo: 30, cHi: 60, iLo: 51, iHi: 100 },
  { cLo: 60, cHi: 90, iLo: 101, iHi: 200 },
  { cLo: 90, cHi: 120, iLo: 201, iHi: 300 },
  { cLo: 120, cHi: 250, iLo: 301, iHi: 400 },
  { cLo: 250, cHi: 500, iLo: 401, iHi: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLo: 0, cHi: 50, iLo: 0, iHi: 50 },
  { cLo: 50, cHi: 100, iLo: 51, iHi: 100 },
  { cLo: 100, cHi: 250, iLo: 101, iHi: 200 },
  { cLo: 250, cHi: 350, iLo: 201, iHi: 300 },
  { cLo: 350, cHi: 430, iLo: 301, iHi: 400 },
  { cLo: 430, cHi: 600, iLo: 401, iHi: 500 },
];

// NO2 breakpoints (µg/m³, 24-hour average)
const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLo: 0, cHi: 40, iLo: 0, iHi: 50 },
  { cLo: 40, cHi: 80, iLo: 51, iHi: 100 },
  { cLo: 80, cHi: 180, iLo: 101, iHi: 200 },
  { cLo: 180, cHi: 280, iLo: 201, iHi: 300 },
  { cLo: 280, cHi: 400, iLo: 301, iHi: 400 },
  { cLo: 400, cHi: 800, iLo: 401, iHi: 500 },
];

// SO2 breakpoints (µg/m³, 24-hour average)
const SO2_BREAKPOINTS: Breakpoint[] = [
  { cLo: 0, cHi: 40, iLo: 0, iHi: 50 },
  { cLo: 40, cHi: 80, iLo: 51, iHi: 100 },
  { cLo: 80, cHi: 380, iLo: 101, iHi: 200 },
  { cLo: 380, cHi: 800, iLo: 201, iHi: 300 },
  { cLo: 800, cHi: 1600, iLo: 301, iHi: 400 },
  { cLo: 1600, cHi: 2100, iLo: 401, iHi: 500 },
];

// CO breakpoints (mg/m³, 8-hour average)
const CO_BREAKPOINTS: Breakpoint[] = [
  { cLo: 0, cHi: 1.0, iLo: 0, iHi: 50 },
  { cLo: 1.0, cHi: 2.0, iLo: 51, iHi: 100 },
  { cLo: 2.0, cHi: 10.0, iLo: 101, iHi: 200 },
  { cLo: 10.0, cHi: 17.0, iLo: 201, iHi: 300 },
  { cLo: 17.0, cHi: 34.0, iLo: 301, iHi: 400 },
  { cLo: 34.0, cHi: 50.0, iLo: 401, iHi: 500 },
];

// O3 breakpoints (µg/m³, 8-hour average)
const O3_BREAKPOINTS: Breakpoint[] = [
  { cLo: 0, cHi: 50, iLo: 0, iHi: 50 },
  { cLo: 50, cHi: 100, iLo: 51, iHi: 100 },
  { cLo: 100, cHi: 168, iLo: 101, iHi: 200 },
  { cLo: 168, cHi: 208, iLo: 201, iHi: 300 },
  { cLo: 208, cHi: 748, iLo: 301, iHi: 400 },
  { cLo: 748, cHi: 1000, iLo: 401, iHi: 500 },
];

// ─── AQI Category Thresholds ────────────────────────────────────────────────────

export const AQI_CATEGORIES: { max: number; category: AQICategory; color: string }[] = [
  { max: 50, category: 'GOOD', color: '#22c55e' },
  { max: 100, category: 'SATISFACTORY', color: '#84cc16' },
  { max: 200, category: 'MODERATE', color: '#f59e0b' },
  { max: 300, category: 'POOR', color: '#f97316' },
  { max: 400, category: 'VERY_POOR', color: '#ef4444' },
  { max: 500, category: 'SEVERE', color: '#7c3aed' },
];

// ─── Sub-Index Calculation ──────────────────────────────────────────────────────

/**
 * Calculate the sub-index for a single pollutant concentration using linear
 * interpolation within the matched NAQI breakpoint band.
 *
 * Returns null if the concentration falls outside all defined breakpoints
 * or if the input is not a finite positive number.
 */
export function calculateSubIndex(
  concentration: number,
  breakpoints: Breakpoint[]
): number | null {
  if (!Number.isFinite(concentration) || concentration < 0) return null;

  for (const bp of breakpoints) {
    if (concentration >= bp.cLo && concentration <= bp.cHi) {
      const si =
        ((bp.iHi - bp.iLo) / (bp.cHi - bp.cLo)) * (concentration - bp.cLo) + bp.iLo;
      return Math.round(si);
    }
  }
  // If above all breakpoints, cap at 500 (SEVERE maximum)
  return 500;
}

// ─── AQI Category Resolution ────────────────────────────────────────────────────

export function resolveAQICategory(aqi: number): { category: AQICategory; color: string } {
  for (const entry of AQI_CATEGORIES) {
    if (aqi <= entry.max) return { category: entry.category, color: entry.color };
  }
  return { category: 'SEVERE', color: '#7c3aed' };
}

// ─── Main AQI Calculator ────────────────────────────────────────────────────────

/**
 * Calculate the Indian NAQI from a set of pollutant concentrations.
 * The final AQI is the maximum sub-index across all pollutants for which
 * a valid concentration is available.
 */
export function calculateAQI(pollutants: PollutantConcentrations): AQIResult {
  const candidates: { pollutant: keyof PollutantConcentrations; si: number }[] = [];

  const eval_ = (
    key: keyof PollutantConcentrations,
    bps: Breakpoint[]
  ) => {
    const si = calculateSubIndex(pollutants[key], bps);
    if (si !== null) candidates.push({ pollutant: key, si });
  };

  eval_('pm25', PM25_BREAKPOINTS);
  eval_('pm10', PM10_BREAKPOINTS);
  eval_('no2', NO2_BREAKPOINTS);
  eval_('so2', SO2_BREAKPOINTS);
  eval_('co', CO_BREAKPOINTS);
  eval_('o3', O3_BREAKPOINTS);

  if (candidates.length === 0) {
    // No valid readings — return a sentinel representing missing data
    return { value: 0, category: 'GOOD', primaryPollutant: 'pm25', categoryColor: '#22c55e' };
  }

  const dominant = candidates.reduce((max, c) => (c.si > max.si ? c : max));
  const { category, color } = resolveAQICategory(dominant.si);

  return {
    value: dominant.si,
    category,
    primaryPollutant: dominant.pollutant,
    categoryColor: color,
  };
}
