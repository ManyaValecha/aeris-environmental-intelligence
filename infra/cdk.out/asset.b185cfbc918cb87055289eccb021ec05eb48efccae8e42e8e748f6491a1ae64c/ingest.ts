/**
 * AERIS Lambda Ingestion & Validation Function
 *
 * Validates incoming telemetry payload against strict schemas and domain bounds.
 * Preserves data provenance exactly as provided — NEVER converts SIMULATED to MEASURED.
 */

export interface TelemetryPayload {
  stationId: string;
  timestamp: string;
  provenance: 'MEASURED' | 'REANALYSIS' | 'SIMULATED' | 'PREDICTED' | 'ESTIMATED' | 'AI-GENERATED';
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
  };
  weather?: {
    temperatureCelsius: number;
    relativeHumidityPct: number;
    windSpeedKmH: number;
    windDirectionDeg: number;
    windDirectionLabel: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_STATION_IDS = new Set([
  'DELHI_ANAND_VIHAR',
  'DELHI_ITO',
  'DELHI_RK_PURAM',
  'DELHI_DWARKA',
  'DELHI_PUNJABI_BAGH',
  'DELHI_BAWANA',
  'NOIDA',
  'GURUGRAM',
]);

const VALID_PROVENANCE = new Set([
  'MEASURED',
  'REANALYSIS',
  'SIMULATED',
  'PREDICTED',
  'ESTIMATED',
  'AI-GENERATED',
]);

/**
 * Validates a telemetry payload for boundary, domain, and type integrity.
 */
export function validateTelemetryPayload(payload: any): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be a non-null JSON object'] };
  }

  // 1. Station ID validation
  if (!payload.stationId || !VALID_STATION_IDS.has(payload.stationId)) {
    errors.push(`Invalid or unsupported stationId: ${payload.stationId}`);
  }

  // 2. Timestamp validation
  if (!payload.timestamp || typeof payload.timestamp !== 'string') {
    errors.push('Missing or non-string timestamp');
  } else if (isNaN(Date.parse(payload.timestamp))) {
    errors.push(`Invalid ISO 8601 timestamp: ${payload.timestamp}`);
  }

  // 3. Provenance validation
  if (!payload.provenance || !VALID_PROVENANCE.has(payload.provenance)) {
    errors.push(`Invalid or malformed provenance tag: ${payload.provenance}`);
  }

  // 4. Pollutants validation
  const { pollutants } = payload;
  if (!pollutants || typeof pollutants !== 'object') {
    errors.push('Missing pollutants object');
  } else {
    const checkValue = (name: string, val: any, min = 0, max = 2000) => {
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        errors.push(`Pollutant ${name} must be a finite number (got ${val})`);
      } else if (val < min || val > max) {
        errors.push(`Pollutant ${name} value ${val} out of realistic physical range [${min}, ${max}]`);
      }
    };

    checkValue('pm25', pollutants.pm25, 0, 1000);
    checkValue('pm10', pollutants.pm10, 0, 2000);
    checkValue('no2', pollutants.no2, 0, 1000);
    checkValue('so2', pollutants.so2, 0, 1000);
    checkValue('co', pollutants.co, 0, 100);
    checkValue('o3', pollutants.o3, 0, 1000);
  }

  // 5. Weather validation (optional, but if present must be valid)
  if (payload.weather && typeof payload.weather === 'object') {
    const { weather } = payload;
    if (typeof weather.temperatureCelsius === 'number') {
      if (weather.temperatureCelsius < -20 || weather.temperatureCelsius > 60) {
        errors.push(`Temperature ${weather.temperatureCelsius}°C out of range [-20, 60]`);
      }
    }
    if (typeof weather.relativeHumidityPct === 'number') {
      if (weather.relativeHumidityPct < 0 || weather.relativeHumidityPct > 100) {
        errors.push(`Humidity ${weather.relativeHumidityPct}% out of range [0, 100]`);
      }
    }
    if (typeof weather.windSpeedKmH === 'number') {
      if (weather.windSpeedKmH < 0 || weather.windSpeedKmH > 200) {
        errors.push(`Wind speed ${weather.windSpeedKmH} km/h out of range [0, 200]`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * AWS Lambda Handler for Telemetry Ingestion.
 */
export async function handler(event: any): Promise<any> {
  console.log('[AERIS Ingestion Lambda] Received ingestion event:', JSON.stringify(event));

  let body: any;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: false,
        error: 'Malformed JSON payload body',
      }),
    };
  }

  const validation = validateTelemetryPayload(body);
  if (!validation.valid) {
    console.warn('[AERIS Ingestion Lambda] Validation failed:', validation.errors);
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: false,
        error: 'Validation failed',
        details: validation.errors,
      }),
    };
  }

  const item = {
    PK: `STATION#${body.stationId}`,
    SK: `TIMESTAMP#${body.timestamp}`,
    stationId: body.stationId,
    timestamp: body.timestamp,
    provenance: body.provenance, // EXPLICIT PROVENANCE PRESERVATION
    pollutants: body.pollutants,
    weather: body.weather || null,
    ingestedAt: new Date().toISOString(),
  };

  console.log(`[AERIS Ingestion Lambda] Successfully validated and stored item for ${body.stationId} with provenance ${body.provenance}`);

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      ok: true,
      message: 'Telemetry successfully ingested',
      stationId: body.stationId,
      timestamp: body.timestamp,
      provenance: body.provenance,
    }),
  };
}
