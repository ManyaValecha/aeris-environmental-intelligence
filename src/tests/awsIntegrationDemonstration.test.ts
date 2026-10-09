import { describe, it, expect } from 'vitest';
import { handler as ingestHandler, validateTelemetryPayload } from '../../infra/lambda/ingest';
import { handler as apiHandler } from '../../infra/lambda/api';
import { AWSDataProvider } from '@/services/api/awsDataProvider';

describe('AWS Integration Local Demonstration & Architecture Trace', () => {
  it('1. Validates telemetry payload schema and physical bounds correctly', () => {
    const validPayload = {
      stationId: 'DELHI_ANAND_VIHAR',
      timestamp: '2026-10-09T12:00:00.000Z',
      provenance: 'MEASURED',
      pollutants: { pm25: 185.2, pm10: 310.0, no2: 76.4, so2: 18.2, co: 2.1, o3: 38.0 },
      weather: { temperatureCelsius: 26.0, relativeHumidityPct: 62.0, windSpeedKmH: 8.5, windDirectionDeg: 290, windDirectionLabel: 'WNW' },
    };

    const validResult = validateTelemetryPayload(validPayload);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    const invalidPayload = {
      stationId: 'INVALID_STATION_LOCATION',
      timestamp: 'invalid-date-format',
      provenance: 'MEASURED',
      pollutants: { pm25: -50.0, pm10: 'NaN' },
    };

    const invalidResult = validateTelemetryPayload(invalidPayload);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('2. Executes Ingestion Lambda handler with EventBridge Scheduled Event (labeled SIMULATED)', async () => {
    const scheduledEvent = {
      id: 'cdc73f9d-8b92-49f9-8d76-880054e0c384',
      'detail-type': 'Scheduled Event',
      source: 'aws.events',
      account: '123456789012',
      time: '2026-10-09T12:15:00Z',
      region: 'us-east-1',
      resources: ['arn:aws:events:us-east-1:123456789012:rule/aeris-15min-ingestion-rule'],
      detail: {},
    };

    const response = await ingestHandler(scheduledEvent);
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.ok).toBe(true);
    expect(body.provenance).toBe('SIMULATED'); // EXPLICIT SIMULATED PROVENANCE
  });

  it('3. Executes API Proxy Lambda handler for REST routes', async () => {
    // GET /stations
    const getStationsEvent = { httpMethod: 'GET', path: '/stations' };
    const stationsRes = await apiHandler(getStationsEvent);
    expect(stationsRes.statusCode).toBe(200);
    const stationsBody = JSON.parse(stationsRes.body);
    expect(stationsBody.ok).toBe(true);
    expect(stationsBody.stations).toHaveLength(8);

    // GET /stations/DELHI_ITO/latest
    const getLatestEvent = { httpMethod: 'GET', path: '/stations/DELHI_ITO/latest' };
    const latestRes = await apiHandler(getLatestEvent);
    expect(latestRes.statusCode).toBe(200);
    const latestBody = JSON.parse(latestRes.body);
    expect(latestBody.ok).toBe(true);
    expect(latestBody.telemetry.stationId).toBe('DELHI_ITO');
    expect(latestBody.telemetry.provenance).toBe('REANALYSIS');

    // POST /telemetry
    const postTelemetryEvent = {
      httpMethod: 'POST',
      path: '/telemetry',
      body: JSON.stringify({
        stationId: 'DELHI_ANAND_VIHAR',
        timestamp: '2026-10-09T12:00:00.000Z',
        provenance: 'MEASURED',
        pollutants: { pm25: 180, pm10: 290, no2: 70, so2: 15, co: 1.8, o3: 40 },
      }),
    };
    const ingestRes = await apiHandler(postTelemetryEvent);
    expect(ingestRes.statusCode).toBe(201);
    const ingestBody = JSON.parse(ingestRes.body);
    expect(ingestBody.ok).toBe(true);
    expect(ingestBody.provenance).toBe('MEASURED');
  });

  it('4. Verifies AWSDataProvider transparent fallback on unreachable endpoint', async () => {
    const provider = new AWSDataProvider('https://unreachable-mock-api.internal');
    expect(provider.degraded).toBe(false);

    // Should gracefully fall back to DemoDataProvider without throwing
    const stations = await provider.getStations();
    expect(stations.length).toBe(8);
    expect(provider.degraded).toBe(true);
  });
});
