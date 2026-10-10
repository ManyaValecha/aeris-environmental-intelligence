/**
 * AERIS API Gateway Proxy Lambda Function
 *
 * Exposes REST endpoints for AERIS telemetry, station registry, and history queries.
 * Returns structured JSON responses preserving provenance on all data payloads.
 */

import { handler as ingestHandler } from './ingest';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({});
const COPILOT_SYSTEM_PROMPT = [
  'You are AERIS, an environmental intelligence assistant for Delhi NCR.',
  'Use only the supplied JSON. Never invent measurements, forecasts, causes, or confidence scores.',
  'Do not present AI text as measured data or correlation as causation.',
  'The data may be simulated; never call it live unless verified.',
  'Return valid JSON with keys what, why, next, action, disclaimers.',
  'Use concise summaries and lists for evidence, factors, forecasts, and recommendations.',
  'Use only supplied forecast values; do not invent missing forecasts.'
].join(' ');


export async function handler(event: any): Promise<any> {
  const path = event.path || event.resource || '/';
  const httpMethod = event.httpMethod || 'GET';

  console.log(`[AERIS API Lambda] Request ${httpMethod} ${path}`);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // POST /telemetry
  if (httpMethod === 'POST' && (path === '/telemetry' || path.endsWith('/telemetry'))) {
    return ingestHandler(event);
  }

    // POST /copilot — server-side Bedrock inference
  if (httpMethod === 'POST' && (path === '/copilot' || path.endsWith('/copilot'))) {
    try {
      const context = JSON.parse(event.body || '{}');
      if (!context || typeof context !== 'object' || Array.isArray(context)) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'A JSON context object is required' }) };
      }
      const response = await bedrock.send(new ConverseCommand({
        modelId: process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0',
        system: [{ text: COPILOT_SYSTEM_PROMPT }],
        messages: [{ role: 'user', content: [{ text: JSON.stringify(context) }] }],
        inferenceConfig: { maxTokens: 1400, temperature: 0.1 }
      }));
      const answer = response.output?.message?.content?.find(block => 'text' in block)?.text;
      if (!answer) throw new Error('Bedrock returned no text');
      let result;
      try { result = JSON.parse(answer); }
      catch { throw new Error('Bedrock response was not valid JSON'); }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, generatedBy: 'BEDROCK', dataMode: context.dataMode || 'UNKNOWN', result })
      };
    } catch (error) {
      console.error('[AERIS Copilot] Bedrock request failed:', error);
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'Bedrock unavailable; use deterministic fallback.' }) };
    }
  }

// GET /stations
  if (httpMethod === 'GET' && (path === '/stations' || path.endsWith('/stations'))) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        dataMode: 'AWS',
        timestamp: new Date().toISOString(),
        stations: [
          { id: 'DELHI_ANAND_VIHAR', name: 'Anand Vihar', locality: 'East Delhi' },
          { id: 'DELHI_ITO', name: 'ITO', locality: 'Central Delhi' },
          { id: 'DELHI_RK_PURAM', name: 'RK Puram', locality: 'South Delhi' },
          { id: 'DELHI_DWARKA', name: 'Dwarka Sector 8', locality: 'South West Delhi' },
          { id: 'DELHI_PUNJABI_BAGH', name: 'Punjabi Bagh', locality: 'West Delhi' },
          { id: 'DELHI_BAWANA', name: 'Bawana', locality: 'North West Delhi' },
          { id: 'NOIDA', name: 'Sector 62 Noida', locality: 'Noida, UP' },
          { id: 'GURUGRAM', name: 'Vikas Sadan', locality: 'Gurugram, Haryana' },
        ],
      }),
    };
  }

  // GET /stations/{stationId}/latest
  const latestMatch = path.match(/\/stations\/([^/]+)\/latest$/);
  if (httpMethod === 'GET' && latestMatch) {
    const stationId = latestMatch[1];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        dataMode: 'AWS',
        timestamp: new Date().toISOString(),
        telemetry: {
          stationId,
          timestamp: new Date().toISOString(),
          provenance: 'REANALYSIS',
          aqi: { value: 320, category: 'VERY_POOR', primaryPollutant: 'pm25', categoryColor: '#F59E0B' },
          pollutants: { pm25: 165, pm10: 275, no2: 78, so2: 16, co: 1.9, o3: 42 },
          weather: { temperatureCelsius: 27, relativeHumidityPct: 60, windSpeedKmH: 4.8, windDirectionDeg: 280, windDirectionLabel: 'WNW' },
        },
      }),
    };
  }

  // GET /stations/{stationId}/history
  const historyMatch = path.match(/\/stations\/([^/]+)\/history$/);
  if (httpMethod === 'GET' && historyMatch) {
    const stationId = historyMatch[1];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        dataMode: 'AWS',
        timestamp: new Date().toISOString(),
        stationId,
        history: [
          { timestamp: new Date(Date.now() - 3600000).toISOString(), pm25: 160, pm10: 270, no2: 75, temperature: 26, humidity: 62, windSpeed: 5, provenance: 'REANALYSIS' },
          { timestamp: new Date().toISOString(), pm25: 165, pm10: 275, no2: 78, temperature: 27, humidity: 60, windSpeed: 4.8, provenance: 'REANALYSIS' },
        ],
      }),
    };
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ ok: false, error: `Route not found: ${httpMethod} ${path}` }),
  };
}
