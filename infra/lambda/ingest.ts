/**
 * AERIS Lambda Ingestion & Validation Function
 *
 * Validates incoming telemetry payload against strict schemas and domain bounds.
 * Preserves data provenance exactly as provided — NEVER converts SIMULATED to MEASURED.
 * On success, persists validated telemetry to DynamoDB AerisTelemetry table.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME || 'AerisTelemetry';

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

export const VALID_STATION_IDS = new Set([
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
 * Explicit physical range bounds prevent garbage data from entering DynamoDB.
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
 * Persists a validated telemetry payload to DynamoDB.
 * PK = STATION#{stationId}, SK = TIMESTAMP#{iso} — enables time-range queries per station.
 * Provenance is stored exactly as supplied — never mutated.
 */
async function persistToDb(body: TelemetryPayload): Promise<void> {
  const item = {
    PK: `STATION#${body.stationId}`,
    SK: `TIMESTAMP#${body.timestamp}`,
    stationId: body.stationId,
    timestamp: body.timestamp,
    provenance: body.provenance, // EXPLICIT PROVENANCE PRESERVATION — never mutated
    pollutants: body.pollutants,
    weather: body.weather ?? null,
    ingestedAt: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30-day TTL auto-expire
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      // Idempotent: overwrite if same PK+SK already exists (replay-safe)
      ConditionExpression: 'attribute_not_exists(PK) OR provenance = :prov',
      ExpressionAttributeValues: { ':prov': body.provenance },
    })
  );

  console.log(`[AERIS Ingest] Persisted PK=${item.PK} SK=${item.SK} provenance=${item.provenance}`);
}

/** Demo sweep payloads used by EventBridge 15-minute scheduled rule */
const SCHEDULED_SWEEP: TelemetryPayload[] = [
  {
    stationId: 'DELHI_ANAND_VIHAR',
    timestamp: new Date().toISOString(),
    provenance: 'SIMULATED',
    pollutants: { pm25: 285, pm10: 410, no2: 92, so2: 22, co: 2.4, o3: 38 },
    weather: { temperatureCelsius: 29, relativeHumidityPct: 58, windSpeedKmH: 3.5, windDirectionDeg: 260, windDirectionLabel: 'W' },
  },
  {
    stationId: 'DELHI_ITO',
    timestamp: new Date().toISOString(),
    provenance: 'SIMULATED',
    pollutants: { pm25: 175, pm10: 285, no2: 80, so2: 17, co: 2.0, o3: 44 },
    weather: { temperatureCelsius: 28, relativeHumidityPct: 60, windSpeedKmH: 5.0, windDirectionDeg: 280, windDirectionLabel: 'WNW' },
  },
  {
    stationId: 'DELHI_RK_PURAM',
    timestamp: new Date().toISOString(),
    provenance: 'SIMULATED',
    pollutants: { pm25: 210, pm10: 325, no2: 85, so2: 19, co: 2.2, o3: 41 },
    weather: { temperatureCelsius: 27, relativeHumidityPct: 62, windSpeedKmH: 4.2, windDirectionDeg: 270, windDirectionLabel: 'W' },
  },
  {
    stationId: 'NOIDA',
    timestamp: new Date().toISOString(),
    provenance: 'SIMULATED',
    pollutants: { pm25: 195, pm10: 300, no2: 76, so2: 15, co: 1.8, o3: 47 },
    weather: { temperatureCelsius: 30, relativeHumidityPct: 55, windSpeedKmH: 6.1, windDirectionDeg: 295, windDirectionLabel: 'WNW' },
  },
];

/**
 * AWS Lambda Handler for Telemetry Ingestion.
 */
export async function handler(event: any): Promise<any> {
  console.log('[AERIS Ingestion Lambda] Received event:', JSON.stringify(event));

  const responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // ── EventBridge Scheduled Rule Invocation ──────────────────────────────────
  if (event.source === 'aws.events' || event['detail-type'] === 'Scheduled Event') {
    console.log('[AERIS EventBridge] Scheduled sweep — provenance=SIMULATED on all records');
    const ts = new Date().toISOString();
    const sweep = SCHEDULED_SWEEP.map(p => ({ ...p, timestamp: ts }));

    const results: Array<{ stationId: string; ok: boolean; error?: string }> = [];
    for (const payload of sweep) {
      try {
        await persistToDb(payload);
        results.push({ stationId: payload.stationId, ok: true });
      } catch (err: any) {
        // ConditionalCheckFailed = already exists with same provenance (idempotent) → OK
        if (err?.name === 'ConditionalCheckFailedException') {
          results.push({ stationId: payload.stationId, ok: true });
        } else {
          console.error(`[AERIS EventBridge] Failed to persist ${payload.stationId}:`, err);
          results.push({ stationId: payload.stationId, ok: false, error: err?.message });
        }
      }
    }

    return {
      statusCode: 201,
      headers: responseHeaders,
      body: JSON.stringify({
        ok: true,
        message: 'EventBridge scheduled sweep ingested — provenance=SIMULATED (never MEASURED)',
        provenance: 'SIMULATED',
        timestamp: ts,
        stations: results,
      }),
    };
  }

  // ── REST POST /telemetry Invocation ───────────────────────────────────────
  let body: any;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return {
      statusCode: 400,
      headers: responseHeaders,
      body: JSON.stringify({ ok: false, error: 'Malformed JSON payload body' }),
    };
  }

  const validation = validateTelemetryPayload(body);
  if (!validation.valid) {
    console.warn('[AERIS Ingest] Validation failed:', validation.errors);
    return {
      statusCode: 422,
      headers: responseHeaders,
      body: JSON.stringify({
        ok: false,
        error: 'Validation failed',
        details: validation.errors,
      }),
    };
  }

  try {
    await persistToDb(body as TelemetryPayload);
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') {
      // Idempotent duplicate — return 200 OK
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          ok: true,
          message: 'Duplicate telemetry record (idempotent)',
          stationId: body.stationId,
          timestamp: body.timestamp,
          provenance: body.provenance,
        }),
      };
    }
    console.error('[AERIS Ingest] DynamoDB PutCommand failed:', err);
    return {
      statusCode: 502,
      headers: responseHeaders,
      body: JSON.stringify({ ok: false, error: 'DynamoDB write failed — check Lambda IAM and table configuration' }),
    };
  }

  return {
    statusCode: 201,
    headers: responseHeaders,
    body: JSON.stringify({
      ok: true,
      message: 'Telemetry successfully ingested to DynamoDB',
      stationId: body.stationId,
      timestamp: body.timestamp,
      provenance: body.provenance,
    }),
  };
}
