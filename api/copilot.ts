import {
BedrockRuntimeClient,
ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0';
const REGION = process.env.AWS_REGION || 'us-east-1';

const SYSTEM_PROMPT = `You are AERIS, an environmental intelligence assistant for Delhi NCR.
Use only the supplied structured context. Never invent measurements, forecasts,
weather, causes, confidence scores, AQI values, or intervention outcomes.
Distinguish REANALYSIS, PREDICTED, ESTIMATED, and AI-GENERATED content.
Correlation is not causation. Describe intervention outputs as sensitivity
estimates, not causal predictions.
Return only valid JSON with keys:
what {summary,evidence}, why {summary,factors},
next {summary,forecasts}, action {summary,recommendations}, disclaimers.
Each section must be concise. All numbers must come from the supplied context.`.trim();

function errorMessage(error: unknown): string {
return error instanceof Error ? error.message : 'Unknown server error';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
res.setHeader('Cache-Control', 'no-store');

if (req.method !== 'POST') {
res.setHeader('Allow', 'POST');
return res.status(405).json({ error: 'Method not allowed' });
}

const context = req.body?.context;
if (!context || typeof context !== 'object' ||
typeof context.stationId !== 'string' ||
typeof context.stationName !== 'string') {
return res.status(400).json({ error: 'A valid AERIS context is required.' });
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
return res.status(503).json({
error: 'Bedrock server credentials are not configured.',
generatedBy: 'DETERMINISTIC',
});
}

try {
const client = new BedrockRuntimeClient({ region: REGION });
const response = await client.send(new ConverseCommand({
modelId: MODEL_ID,
system: [{ text: SYSTEM_PROMPT }],
messages: [{
role: 'user',
content: [{ text: JSON.stringify(context) }],
}],
inferenceConfig: { maxTokens: 1200, temperature: 0 },
}));

````
const text = response.output?.message?.content
  ?.map((block) => ('text' in block ? block.text : ''))
  .join('')
  .trim();

if (!text) throw new Error('Bedrock returned an empty response.');

const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
const parsed = JSON.parse(jsonText);

for (const key of ['what', 'why', 'next', 'action']) {
  if (!parsed[key] || typeof parsed[key].summary !== 'string') {
    throw new Error(`Bedrock response is missing valid "${key}" content.`);
  }
}

return res.status(200).json({
  ...parsed,
  stationId: context.stationId,
  stationName: context.stationName,
  generatedAt: new Date().toISOString(),
  generatedBy: 'BEDROCK',
  provenanceIndex: [],
  disclaimers: [
    ...(Array.isArray(parsed.disclaimers) ? parsed.disclaimers : []),
    'AI-generated interpretation of supplied context; not a measurement or guarantee.',
  ],
  isDemoMode: context.dataMode !== 'REAL',
});
````

} catch (error) {
console.error('[AERIS Bedrock API]', errorMessage(error));
return res.status(502).json({
error: 'Bedrock generation failed. Use the deterministic fallback.',
generatedBy: 'DETERMINISTIC',
});
}
}
