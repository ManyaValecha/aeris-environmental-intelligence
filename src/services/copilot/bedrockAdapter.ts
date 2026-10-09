/**
 * AERIS Bedrock Copilot Adapter
 *
 * Provides a clean interface for AWS Bedrock integration.
 * This adapter is intentionally abstracted — it does NOT hard-code a Bedrock
 * model ID or API endpoint. If Bedrock is unavailable or unconfigured,
 * the application automatically falls back to DeterministicCopilotProvider.
 *
 * The grounded system prompt explicitly forbids:
 *   - Inventing measurements, forecasts, or weather values
 *   - Treating correlation as causation
 *   - Presenting AI-generated text as measured data
 *   - Fabricating confidence scores
 *   - Claiming interventions "will" reduce pollution
 *
 * HOW TO ACTIVATE BEDROCK:
 *   1. Set environment variable VITE_BEDROCK_MODEL_ID to the desired model ARN/ID.
 *   2. Configure AWS credentials in the environment (standard AWS credential chain).
 *   3. The application will automatically select BedrockCopilotProvider when available.
 *
 * ⚠ DO NOT activate this adapter without valid AWS credentials and Bedrock access.
 *   Invalid configuration falls back to deterministic mode automatically.
 */

import type { CopilotContext, CopilotProvider, CopilotResponse } from './copilotTypes';
import { DeterministicCopilotProvider } from './deterministicCopilot';

// ─── Grounded System Prompt ───────────────────────────────────────────────────
// Supplied separately from user context — never mixed.

export const AERIS_SYSTEM_PROMPT = `
You are the environmental intelligence layer of AERIS (AI Environmental Response & Intelligence System).

Your role is to produce structured, concise, actionable intelligence briefs for environmental decision-makers in Delhi NCR.

STRICT RULES — You MUST follow ALL of these:
1. You may ONLY use information contained in the supplied structured context object.
2. NEVER invent measurements, forecasts, weather values, causes, or intervention outcomes.
3. NEVER present AI-generated text as measured or predicted data.
4. NEVER fabricate confidence scores or AQI values.
5. NEVER claim an intervention "will" reduce pollution. Use "the scenario estimates" or "under selected assumptions".
6. NEVER turn correlation into causation. Use "signals that may be associated with" not "X causes Y".
7. NEVER describe the intervention simulator as a causal atmospheric chemistry model.
8. Distinguish: REANALYSIS (gridded historical), PREDICTED (ML forecast), ESTIMATED (scenario sensitivity).
9. When citing numbers, use ONLY values from the supplied context JSON.
10. Each section must be concise (2–4 sentences max per insight).

LANGUAGE REQUIREMENTS:
- "observed in the available data" / "recorded at"
- "the forecast estimates" / "projected at"
- "the scenario estimates under selected assumptions"
- "possible contributing factors" / "signals that may be associated with"
- "sensitivity estimate — not a causal prediction"

RESPONSE FORMAT:
Return a valid JSON object exactly matching this schema:
{
  "what": { "summary": string, "evidence": [{ "label": string, "value": string, "unit": string?, "provenance": string }] },
  "why": { "summary": string, "factors": [{ "signal": string, "interpretation": string, "provenance": string }] },
  "next": { "summary": string, "forecasts": [{ "horizon": string, "summary": string, "predictedPm25": number, "aqiCategory": string, "confidenceNote": string, "provenance": "PREDICTED" }] },
  "action": { "summary": string, "recommendations": [{ "audience": "CITIZEN"|"AUTHORITY", "recommendation": string, "basis": string, "provenance": string }] },
  "disclaimers": string[]
}
`.trim();

// ─── Bedrock Provider ─────────────────────────────────────────────────────────

/**
 * BedrockCopilotProvider
 *
 * Skeleton implementation — ready for AWS Bedrock integration.
 * isAvailable() checks for required environment configuration.
 * generate() is not yet implemented; it falls back to deterministic output.
 *
 * To implement: replace the generate() body with an @aws-sdk/client-bedrock-runtime
 * InvokeModelCommand call, passing AERIS_SYSTEM_PROMPT as the system message
 * and a JSON-serialized CopilotContext as the user message.
 */
export class BedrockCopilotProvider implements CopilotProvider {
  readonly id = 'BEDROCK' as const;
  private readonly modelId: string | undefined;
  private readonly fallback = new DeterministicCopilotProvider();

  constructor() {
    // Read model ID from environment — NEVER hard-coded
    this.modelId = import.meta.env['VITE_BEDROCK_MODEL_ID'];
  }

  async isAvailable(): Promise<boolean> {
    // Bedrock is available only when model ID is configured AND we are not
    // in a browser-only context without an API proxy
    if (!this.modelId) return false;
    // Additional connectivity check would go here in production
    return false; // Conservative: require explicit activation
  }

  async generate(context: CopilotContext): Promise<CopilotResponse> {
    const available = await this.isAvailable();
    if (!available) {
      // Transparent fallback — never silently fail
      const result = await this.fallback.generate(context);
      return {
        ...result,
        disclaimers: [
          'Bedrock provider is not configured or unavailable. This response was generated by the deterministic rule-based Copilot.',
          ...result.disclaimers,
        ],
      };
    }

    // ─── BEDROCK IMPLEMENTATION PLACEHOLDER ────────────────────────────────
    // When Bedrock is available:
    // 1. Import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
    // 2. Build the request body:
    //    {
    //      system: AERIS_SYSTEM_PROMPT,
    //      messages: [{ role: 'user', content: JSON.stringify(context) }],
    //    }
    // 3. Invoke the model and parse the response JSON.
    // 4. Map the parsed JSON onto CopilotResponse, injecting provenance fields.
    // 5. Return the response with generatedBy: 'BEDROCK'.
    //
    // DO NOT implement until AWS credentials and Bedrock model access are confirmed.
    // ─────────────────────────────────────────────────────────────────────────

    return this.fallback.generate(context);
  }
}
