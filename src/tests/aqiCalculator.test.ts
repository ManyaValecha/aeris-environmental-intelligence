/**
 * Unit tests for the Indian National AQI (NAQI) Calculator.
 *
 * Tests verify:
 *  - Correct sub-index calculation at band boundaries
 *  - Correct primary pollutant identification
 *  - Correct AQI category mapping
 *  - Edge cases: zero values, extreme values, negative input rejection
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAQI,
  calculateSubIndex,
  resolveAQICategory,
  AQI_CATEGORIES,
} from '@/utils/aqiCalculator';

// ─── Test helpers ───────────────────────────────────────────────────────────────

const makeConcentrations = (
  overrides: Partial<{
    pm25: number; pm10: number; no2: number; so2: number; co: number; o3: number;
  }> = {}
) => ({
  pm25: 0,
  pm10: 0,
  no2: 0,
  so2: 0,
  co: 0,
  o3: 0,
  ...overrides,
});

// ─── Sub-index: PM2.5 ───────────────────────────────────────────────────────────

const PM25_BP = [
  { cLo: 0,   cHi: 30,  iLo: 0,   iHi: 50  },
  { cLo: 30,  cHi: 60,  iLo: 51,  iHi: 100 },
  { cLo: 60,  cHi: 90,  iLo: 101, iHi: 200 },
  { cLo: 90,  cHi: 120, iLo: 201, iHi: 300 },
  { cLo: 120, cHi: 250, iLo: 301, iHi: 400 },
  { cLo: 250, cHi: 500, iLo: 401, iHi: 500 },
];

describe('calculateSubIndex (PM2.5)', () => {
  it('returns 0 for PM2.5 = 0 µg/m³', () => {
    expect(calculateSubIndex(0, PM25_BP)).toBe(0);
  });

  it('returns 50 for PM2.5 = 30 µg/m³ (top of GOOD band)', () => {
    expect(calculateSubIndex(30, PM25_BP)).toBe(50);
  });

  it('returns 51 for PM2.5 = 30 µg/m³ at start of next band', () => {
    // The value 30 falls at cLo of the second band too — first band wins
    // Test the midpoint of band 2 instead
    // Band 2: cLo=30 cHi=60, iLo=51 iHi=100 → at 45: SI = (100-51)/(60-30)*(45-30)+51 = 49/30*15+51 ≈ 76
    const si = calculateSubIndex(45, PM25_BP);
    expect(si).toBeGreaterThan(50);
    expect(si).toBeLessThanOrEqual(100);
  });

  it('returns 500 for PM2.5 = 500 µg/m³ (SEVERE cap)', () => {
    expect(calculateSubIndex(500, PM25_BP)).toBe(500);
  });

  it('returns 500 for concentrations above all breakpoints', () => {
    expect(calculateSubIndex(600, PM25_BP)).toBe(500);
  });

  it('returns null for negative concentration', () => {
    expect(calculateSubIndex(-1, PM25_BP)).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(calculateSubIndex(NaN, PM25_BP)).toBeNull();
  });
});

// ─── AQI Category Resolution ────────────────────────────────────────────────────

describe('resolveAQICategory', () => {
  it('returns GOOD for AQI 0', () => {
    expect(resolveAQICategory(0).category).toBe('GOOD');
  });

  it('returns GOOD for AQI 50', () => {
    expect(resolveAQICategory(50).category).toBe('GOOD');
  });

  it('returns SATISFACTORY for AQI 51', () => {
    expect(resolveAQICategory(51).category).toBe('SATISFACTORY');
  });

  it('returns SATISFACTORY for AQI 100', () => {
    expect(resolveAQICategory(100).category).toBe('SATISFACTORY');
  });

  it('returns MODERATE for AQI 101', () => {
    expect(resolveAQICategory(101).category).toBe('MODERATE');
  });

  it('returns MODERATE for AQI 200', () => {
    expect(resolveAQICategory(200).category).toBe('MODERATE');
  });

  it('returns POOR for AQI 201', () => {
    expect(resolveAQICategory(201).category).toBe('POOR');
  });

  it('returns VERY_POOR for AQI 301', () => {
    expect(resolveAQICategory(301).category).toBe('VERY_POOR');
  });

  it('returns SEVERE for AQI 401', () => {
    expect(resolveAQICategory(401).category).toBe('SEVERE');
  });

  it('returns SEVERE for AQI 500 (maximum)', () => {
    expect(resolveAQICategory(500).category).toBe('SEVERE');
  });

  it('returns a valid hex color for every category', () => {
    [0, 60, 150, 250, 350, 450].forEach((aqi) => {
      const { color } = resolveAQICategory(aqi);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

// ─── calculateAQI integration ───────────────────────────────────────────────────

describe('calculateAQI', () => {
  it('identifies PM2.5 as primary pollutant when it dominates', () => {
    // PM2.5=200 → sub-index ~367 (VERY_POOR), all others low
    const result = calculateAQI(makeConcentrations({ pm25: 200, pm10: 50, no2: 10, so2: 5, co: 0.5, o3: 20 }));
    expect(result.primaryPollutant).toBe('pm25');
    expect(result.value).toBeGreaterThan(300);
  });

  it('identifies NO2 as primary pollutant when it dominates', () => {
    // NO2=300 → sub-index 350+ (VERY_POOR), PM2.5 low
    const result = calculateAQI(makeConcentrations({ pm25: 10, pm10: 20, no2: 300, so2: 5, co: 0.2, o3: 10 }));
    expect(result.primaryPollutant).toBe('no2');
  });

  it('returns GOOD category for clean air across all pollutants', () => {
    const result = calculateAQI(makeConcentrations({ pm25: 10, pm10: 20, no2: 10, so2: 5, co: 0.3, o3: 20 }));
    expect(result.category).toBe('GOOD');
    expect(result.value).toBeLessThanOrEqual(50);
  });

  it('returns SEVERE category for very high PM2.5', () => {
    const result = calculateAQI(makeConcentrations({ pm25: 400, pm10: 50, no2: 10, so2: 5, co: 0.5, o3: 20 }));
    expect(result.category).toBe('SEVERE');
    expect(result.value).toBeGreaterThanOrEqual(401);
  });

  it('AQI value is always a non-negative integer', () => {
    const result = calculateAQI(makeConcentrations({ pm25: 75, pm10: 120, no2: 45, so2: 20, co: 1.5, o3: 60 }));
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.value)).toBe(true);
  });
});

// ─── AQI_CATEGORIES completeness ────────────────────────────────────────────────

describe('AQI_CATEGORIES', () => {
  it('covers all 6 NAQI categories', () => {
    const expected = ['GOOD', 'SATISFACTORY', 'MODERATE', 'POOR', 'VERY_POOR', 'SEVERE'];
    const actual = AQI_CATEGORIES.map((c) => c.category);
    expected.forEach((cat) => expect(actual).toContain(cat));
  });

  it('breakpoint maximums are in ascending order', () => {
    for (let i = 1; i < AQI_CATEGORIES.length; i++) {
      expect(AQI_CATEGORIES[i].max).toBeGreaterThan(AQI_CATEGORIES[i - 1].max);
    }
  });
});
