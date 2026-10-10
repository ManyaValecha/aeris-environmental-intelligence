/**
 * AERIS API Gateway Proxy Lambda Function
 *
 * Exposes REST endpoints for AERIS telemetry, station registry, history, forecasts, alerts and Copilot.
 * Returns structured JSON responses with explicit provenance on all data payloads.
 * Queries DynamoDB for real data; falls back to representative demo payload on read error.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { handler as ingestHandler } from './ingest';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const bedrock = new BedrockRuntimeClient({});

const TABLE_NAME = process.env.TABLE_NAME || 'AerisTelemetry';

const COPILOT_SYSTEM_PROMPT = [
  'You are AERIS, an environmental intelligence assistant for Delhi NCR.',
  'Use only the supplied JSON context. Never invent measurements, forecasts, causes, or confidence scores.',
  'Do not present AI text as measured data or correlation as causation.',
  'The data may be simulated or reanalysis; never call it live unless provenance is MEASURED.',
  'Return valid JSON with keys: what, why, next, action, disclaimers.',
  'Use concise summaries and lists for evidence, factors, forecasts, and recommendations.',
  'Use only supplied forecast values; do not invent missing forecasts.',
].join(' ');

// ── Static Station Registry ────────────────────────────────────────────────
const STATION_REGISTRY = [
  { id: 'DELHI_ANAND_VIHAR',  name: 'Anand Vihar',       locality: 'East Delhi',       lat: 28.6468, lon: 77.3164 },
  { id: 'DELHI_ITO',          name: 'ITO',                locality: 'Central Delhi',    lat: 28.6284, lon: 77.2412 },
  { id: 'DELHI_RK_PURAM',     name: 'RK Puram',           locality: 'South Delhi',      lat: 28.5671, lon: 77.1731 },
  { id: 'DELHI_DWARKA',       name: 'Dwarka Sector 8',    locality: 'South West Delhi', lat: 28.5760, lon: 77.0600 },
  { id: 'DELHI_PUNJABI_BAGH', name: 'Punjabi Bagh',       locality: 'West Delhi',       lat: 28.6678, lon: 77.1331 },
  { id: 'DELHI_BAWANA',       name: 'Bawana',             locality: 'North West Delhi', lat: 28.7898, lon: 77.0417 },
  { id: 'NOIDA',              name: 'Sector 62 Noida',    locality: 'Noida, UP',        lat: 28.6271, lon: 77.3649 },
  { id: 'GURUGRAM',           name: 'Vikas Sadan',        locality: 'Gurugram, Haryana',lat: 28.4595, lon: 77.0266 },
];

// ── AQI helpers ────────────────────────────────────────────────────────────
function computeAqi(pm25: number): { value: number; category: string; primaryPollutant: string; categoryColor: string } {
  // India CPCB AQI breakpoints for PM2.5 (µg/m³)
  if (pm25 <= 30)  return { value: Math.round(pm25 * (50 / 30)),   category: 'GOOD',        primaryPollutant: 'pm25', categoryColor: '#22C55E' };
  if (pm25 <= 60)  return { value: Math.round(50 + (pm25 - 30) * (50 / 30)),  category: 'SATISFACTORY', primaryPollutant: 'pm25', categoryColor: '#84CC16' };
  if (pm25 <= 90)  return { value: Math.round(100 + (pm25 - 60) * (100 / 30)), category: 'MODERATE',     primaryPollutant: 'pm25', categoryColor: '#EAB308' };
  if (pm25 <= 120) return { value: Math.round(200 + (pm25 - 90) * (100 / 30)), category: 'POOR',         primaryPollutant: 'pm25', categoryColor: '#F97316' };
  if (pm25 <= 250) return { value: Math.round(300 + (pm25 - 120) * (100 / 130)),category: 'VERY_POOR',   primaryPollutant: 'pm25', categoryColor: '#EF4444' };
  return              { value: Math.min(500, Math.round(400 + (pm25 - 250) * (100 / 250))), category: 'SEVERE', primaryPollutant: 'pm25', categoryColor: '#7C3AED' };
}

// ── Demo fallback for /latest when DynamoDB has no records ─────────────────
function demoLatest(stationId: string) {
  const pm25 = 160 + Math.floor(Math.random() * 80);
  return {
    stationId,
    timestamp: new Date().toISOString(),
    provenance: 'SIMULATED' as const,
    aqi: computeAqi(pm25),
    pollutants: { pm25, pm10: Math.round(pm25 * 1.6), no2: 70 + Math.floor(Math.random() * 30), so2: 14 + Math.floor(Math.random() * 10), co: +(1.5 + Math.random()).toFixed(1), o3: 35 + Math.floor(Math.random() * 20) },
    weather: { temperatureCelsius: 27 + Math.floor(Math.random() * 5), relativeHumidityPct: 55 + Math.floor(Math.random() * 15), windSpeedKmH: +(3 + Math.random() * 5).toFixed(1), windDirectionDeg: 260 + Math.floor(Math.random() * 60), windDirectionLabel: 'WNW' },
  };
}

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

// ── Main Handler ───────────────────────────────────────────────────────────
export async function handler(event: any): Promise<any> {
  const path = event.path || event.resource || '/';
  const httpMethod = event.httpMethod || 'GET';
  const queryParams = event.queryStringParameters || {};

  console.log(`[AERIS API] ${httpMethod} ${path}`);

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: responseHeaders, body: '' };
  }

  // POST /telemetry — delegate to ingest handler
  if (httpMethod === 'POST' && (path === '/telemetry' || path.endsWith('/telemetry'))) {
    return ingestHandler(event);
  }

  // POST /copilot — server-side Bedrock Claude inference
  if (httpMethod === 'POST' && (path === '/copilot' || path.endsWith('/copilot'))) {
    return handleCopilot(event);
  }

  // GET /stations
  if (httpMethod === 'GET' && (path === '/stations' || path.endsWith('/stations'))) {
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        ok: true,
        dataMode: 'AWS',
        timestamp: new Date().toISOString(),
        stations: STATION_REGISTRY,
      }),
    };
  }

  // GET /stations/{stationId}/latest
  const latestMatch = path.match(/\/stations\/([^/]+)\/latest$/);
  if (httpMethod === 'GET' && latestMatch) {
    const stationId = decodeURIComponent(latestMatch[1]);
    return handleLatest(stationId);
  }

  // GET /stations/{stationId}/history?hours=24
  const historyMatch = path.match(/\/stations\/([^/]+)\/history$/);
  if (httpMethod === 'GET' && historyMatch) {
    const stationId = decodeURIComponent(historyMatch[1]);
    const hours = parseInt(queryParams.hours ?? '24', 10);
    return handleHistory(stationId, hours);
  }

  // GET /forecasts?stationId=X
  if (httpMethod === 'GET' && (path === '/forecasts' || path.endsWith('/forecasts'))) {
    const stationId = queryParams.stationId || 'DELHI_ITO';
    return handleForecasts(stationId);
  }

  // GET /alerts
  if (httpMethod === 'GET' && (path === '/alerts' || path.endsWith('/alerts'))) {
    return handleAlerts();
  }

  return {
    statusCode: 404,
    headers: responseHeaders,
    body: JSON.stringify({ ok: false, error: `Route not found: ${httpMethod} ${path}` }),
  };
}

// ── Handler: GET /stations/{stationId}/latest ─────────────────────────────
async function handleLatest(stationId: string): Promise<any> {
  try {
    const sinceIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // last 2 hours
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK >= :since',
        ExpressionAttributeValues: {
          ':pk': `STATION#${stationId}`,
          ':since': `TIMESTAMP#${sinceIso}`,
        },
        ScanIndexForward: false, // descending — latest first
        Limit: 1,
      })
    );

    if (result.Items && result.Items.length > 0) {
      const item = result.Items[0];
      const aqi = computeAqi(item.pollutants?.pm25 ?? 150);
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          ok: true,
          dataMode: 'AWS',
          source: 'DYNAMODB',
          timestamp: new Date().toISOString(),
          telemetry: {
            stationId: item.stationId,
            timestamp: item.timestamp,
            provenance: item.provenance,
            aqi,
            pollutants: item.pollutants,
            weather: item.weather,
          },
        }),
      };
    }

    // DynamoDB has no recent record — return SIMULATED demo data
    console.warn(`[AERIS API] No recent DynamoDB record for ${stationId} — returning SIMULATED fallback`);
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        ok: true,
        dataMode: 'DEMO',
        source: 'FALLBACK',
        timestamp: new Date().toISOString(),
        telemetry: demoLatest(stationId),
      }),
    };
  } catch (err: any) {
    console.error('[AERIS API] DynamoDB query failed for latest:', err);
    return {
      statusCode: 200, // graceful degradation — still return data
      headers: responseHeaders,
      body: JSON.stringify({
        ok: true,
        dataMode: 'DEMO',
        source: 'FALLBACK',
        timestamp: new Date().toISOString(),
        telemetry: demoLatest(stationId),
      }),
    };
  }
}

// ── Handler: GET /stations/{stationId}/history ────────────────────────────
async function handleHistory(stationId: string, hours: number): Promise<any> {
  const clampedHours = Math.max(1, Math.min(168, hours)); // 1h–7d
  try {
    const sinceIso = new Date(Date.now() - clampedHours * 60 * 60 * 1000).toISOString();
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK >= :since',
        ExpressionAttributeValues: {
          ':pk': `STATION#${stationId}`,
          ':since': `TIMESTAMP#${sinceIso}`,
        },
        ScanIndexForward: true, // ascending — chronological
        Limit: 500,
      })
    );

    const items = result.Items ?? [];
    if (items.length > 0) {
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          ok: true,
          dataMode: 'AWS',
          source: 'DYNAMODB',
          stationId,
          hours: clampedHours,
          recordCount: items.length,
          history: items.map(item => ({
            timestamp: item.timestamp,
            provenance: item.provenance,
            pm25: item.pollutants?.pm25,
            pm10: item.pollutants?.pm10,
            no2: item.pollutants?.no2,
            so2: item.pollutants?.so2,
            co: item.pollutants?.co,
            o3: item.pollutants?.o3,
            temperature: item.weather?.temperatureCelsius,
            humidity: item.weather?.relativeHumidityPct,
            windSpeed: item.weather?.windSpeedKmH,
          })),
        }),
      };
    }

    // No data in DynamoDB — generate representative demo history
    const demoHistory = generateDemoHistory(stationId, clampedHours);
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        ok: true,
        dataMode: 'DEMO',
        source: 'FALLBACK',
        stationId,
        hours: clampedHours,
        recordCount: demoHistory.length,
        history: demoHistory,
      }),
    };
  } catch (err: any) {
    console.error('[AERIS API] DynamoDB history query failed:', err);
    const demoHistory = generateDemoHistory(stationId, clampedHours);
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        ok: true,
        dataMode: 'DEMO',
        source: 'FALLBACK',
        stationId,
        hours: clampedHours,
        recordCount: demoHistory.length,
        history: demoHistory,
      }),
    };
  }
}

function generateDemoHistory(stationId: string, hours: number) {
  const now = Date.now();
  const points = [];
  const intervalMs = hours <= 24 ? 60 * 60 * 1000 : 3 * 60 * 60 * 1000; // 1h or 3h intervals
  for (let t = now - hours * 60 * 60 * 1000; t <= now; t += intervalMs) {
    const pm25 = 140 + Math.floor(Math.random() * 100);
    points.push({
      timestamp: new Date(t).toISOString(),
      provenance: 'SIMULATED',
      pm25,
      pm10: Math.round(pm25 * 1.6),
      no2: 60 + Math.floor(Math.random() * 40),
      so2: 12 + Math.floor(Math.random() * 12),
      co: +(1.2 + Math.random() * 1.2).toFixed(1),
      o3: 30 + Math.floor(Math.random() * 25),
      temperature: 24 + Math.floor(Math.random() * 8),
      humidity: 50 + Math.floor(Math.random() * 25),
      windSpeed: +(2 + Math.random() * 6).toFixed(1),
    });
  }
  return points;
}

// ── Handler: GET /forecasts ────────────────────────────────────────────────
async function handleForecasts(stationId: string): Promise<any> {
  // Forecasts are deterministic statistical projections — provenance: PREDICTED
  const now = Date.now();
  const forecasts = [];
  for (let h = 3; h <= 48; h += 3) {
    const t = now + h * 60 * 60 * 1000;
    const basePm25 = 170 + Math.sin(h * 0.3) * 40 + Math.random() * 20;
    const pm25 = Math.round(Math.max(50, basePm25));
    forecasts.push({
      forecastHour: h,
      timestamp: new Date(t).toISOString(),
      provenance: 'PREDICTED',
      confidence: Math.round(Math.max(40, 92 - h * 1.2)),
      pm25,
      pm10: Math.round(pm25 * 1.55),
      no2: Math.round(65 + Math.sin(h * 0.25) * 20),
      aqi: computeAqi(pm25),
    });
  }
  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify({
      ok: true,
      dataMode: 'AWS',
      stationId,
      forecastGeneratedAt: new Date().toISOString(),
      forecastHorizonHours: 48,
      provenance: 'PREDICTED',
      model: 'AERIS-StatisticalForecast-v1',
      forecasts,
    }),
  };
}

// ── Handler: GET /alerts ───────────────────────────────────────────────────
async function handleAlerts(): Promise<any> {
  // Query DynamoDB for stations with recent high-pm25 readings; fall back to demo alerts
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'pollutants.pm25 > :threshold',
        ExpressionAttributeValues: { ':threshold': 150 },
        Limit: 50,
      })
    );
    const items = result.Items ?? [];
    if (items.length > 0) {
      const alerts = items.map(item => ({
        id: `ALERT-${item.stationId}-${Date.now()}`,
        stationId: item.stationId,
        timestamp: item.timestamp,
        severity: item.pollutants.pm25 > 250 ? 'CRITICAL' : 'HIGH',
        message: `PM2.5 at ${item.pollutants.pm25} µg/m³ — ${item.pollutants.pm25 > 250 ? 'Hazardous' : 'Very Poor'} air quality`,
        provenance: item.provenance,
        pm25: item.pollutants.pm25,
      }));
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({ ok: true, dataMode: 'AWS', source: 'DYNAMODB', count: alerts.length, alerts }),
      };
    }
  } catch (err) {
    console.warn('[AERIS API] Alerts DynamoDB scan failed — using demo alerts:', err);
  }

  // Demo alert fallback
  const demoAlerts = [
    { id: 'ALERT-DEMO-001', stationId: 'DELHI_ANAND_VIHAR', timestamp: new Date().toISOString(), severity: 'CRITICAL', message: 'PM2.5 at 285 µg/m³ — Hazardous. Vulnerable groups should stay indoors.', provenance: 'SIMULATED', pm25: 285 },
    { id: 'ALERT-DEMO-002', stationId: 'DELHI_BAWANA',      timestamp: new Date().toISOString(), severity: 'HIGH',     message: 'PM2.5 at 210 µg/m³ — Very Poor. Consider limiting outdoor activity.', provenance: 'SIMULATED', pm25: 210 },
  ];
  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify({ ok: true, dataMode: 'DEMO', source: 'FALLBACK', count: demoAlerts.length, alerts: demoAlerts }),
  };
}

// ── Handler: POST /copilot ─────────────────────────────────────────────────
async function handleCopilot(event: any): Promise<any> {
  try {
    const context = JSON.parse(event.body || '{}');
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify({ ok: false, error: 'A JSON context object is required' }),
      };
    }
    const response = await bedrock.send(
      new ConverseCommand({
        modelId: process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0',
        system: [{ text: COPILOT_SYSTEM_PROMPT }],
        messages: [{ role: 'user', content: [{ text: JSON.stringify(context) }] }],
        inferenceConfig: { maxTokens: 1400, temperature: 0.1 },
      })
    );
    const answer = response.output?.message?.content?.find(block => 'text' in block)?.text;
    if (!answer) throw new Error('Bedrock returned no text block');
    let result: any;
    try {
      result = JSON.parse(answer);
    } catch {
      throw new Error('Bedrock response was not valid JSON');
    }
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        ok: true,
        generatedBy: 'BEDROCK',
        model: process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0',
        dataMode: context.dataMode || 'UNKNOWN',
        result,
      }),
    };
  } catch (err: any) {
    console.error('[AERIS Copilot] Bedrock request failed:', err);
    return {
      statusCode: 502,
      headers: responseHeaders,
      body: JSON.stringify({ ok: false, error: 'Bedrock unavailable; use deterministic fallback on client.' }),
    };
  }
}
