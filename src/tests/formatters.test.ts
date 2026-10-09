/**
 * Formatter utilities tests.
 */

import { describe, it, expect } from 'vitest';
import { bearingToCompassLabel } from '@/utils/formatters';

describe('bearingToCompassLabel', () => {
  const cases: [number, string][] = [
    [0,   'N'],
    [45,  'NE'],
    [90,  'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
    [270, 'W'],
    [315, 'NW'],
    [360, 'N'],   // 360° wraps to N
    [380, 'NNE'], // > 360 handled
    [-90, 'W'],   // negative handled
  ];

  it.each(cases)('bearing %d° → %s', (bearing, expected) => {
    expect(bearingToCompassLabel(bearing)).toBe(expected);
  });
});
