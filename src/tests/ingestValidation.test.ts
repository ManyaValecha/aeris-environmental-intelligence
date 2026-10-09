import { describe, it, expect } from 'vitest';
import { validateTelemetryPayload } from '../../infra/lambda/ingest';

describe('Ingestion Schema & Provenance Validation', () => {
  const validPayload = {
    stationId: 'DELHI_ITO',
    timestamp: '2026-10-08T10:00:00Z',
    provenance: 'MEASURED',
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

  it('accepts valid telemetry payload with strict provenance', () => {
    const result = validateTelemetryPayload(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid or missing stationId', () => {
    const res1 = validateTelemetryPayload({ ...validPayload, stationId: 'INVALID_STATION' });
    expect(res1.valid).toBe(false);
    expect(res1.errors.some((e) => e.includes('stationId'))).toBe(true);

    const res2 = validateTelemetryPayload({ ...validPayload, stationId: '' });
    expect(res2.valid).toBe(false);
  });

  it('rejects malformed ISO 8601 timestamps', () => {
    const res = validateTelemetryPayload({ ...validPayload, timestamp: 'invalid-date' });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('timestamp'))).toBe(true);
  });

  it('rejects invalid or unapproved provenance tags', () => {
    const res = validateTelemetryPayload({ ...validPayload, provenance: 'FAKE_PROVENANCE' });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('provenance'))).toBe(true);
  });

  it('rejects impossible or non-numeric pollutant concentrations (NaN, Infinity, negative)', () => {
    const nanRes = validateTelemetryPayload({
      ...validPayload,
      pollutants: { ...validPayload.pollutants, pm25: NaN },
    });
    expect(nanRes.valid).toBe(false);

    const infRes = validateTelemetryPayload({
      ...validPayload,
      pollutants: { ...validPayload.pollutants, pm10: Infinity },
    });
    expect(infRes.valid).toBe(false);

    const negRes = validateTelemetryPayload({
      ...validPayload,
      pollutants: { ...validPayload.pollutants, no2: -50 },
    });
    expect(negRes.valid).toBe(false);
  });

  it('preserves provenance tag without altering SIMULATED to MEASURED', () => {
    const simPayload = { ...validPayload, provenance: 'SIMULATED' };
    const res = validateTelemetryPayload(simPayload);
    expect(res.valid).toBe(true);
    expect(simPayload.provenance).toBe('SIMULATED');
  });

  it('guarantees EventBridge scheduled ingestion uses SIMULATED provenance and never MEASURED', async () => {
    const { handler } = await import('../../infra/lambda/ingest');
    const scheduledEvent = {
      source: 'aws.events',
      'detail-type': 'Scheduled Event',
    };

    const res = await handler(scheduledEvent);
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.provenance).toBe('SIMULATED');
    expect(body.provenance).not.toBe('MEASURED');
  });
});
