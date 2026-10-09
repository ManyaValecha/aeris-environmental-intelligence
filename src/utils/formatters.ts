/**
 * Wind direction utilities.
 * Converts a meteorological bearing (0–360°) to a compass label.
 */

const COMPASS_LABELS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
] as const;

/**
 * Returns a 16-point compass label for a bearing in degrees.
 * Input is clamped modulo 360 so negative or >360 values are handled safely.
 */
export function bearingToCompassLabel(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_LABELS[index];
}

/**
 * Format a timestamp for display in the command centre.
 * Returns localised Delhi time string (IST = UTC+5:30).
 */
export function formatIST(isoTimestamp: string): string {
  try {
    return new Date(isoTimestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return isoTimestamp;
  }
}

/**
 * Generate an ISO 8601 timestamp offset from now by `offsetMinutes`.
 * Used by the deterministic demo dataset generator.
 */
export function offsetTimestamp(offsetMinutes: number): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}
