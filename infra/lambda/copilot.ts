
import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

export interface CopilotInput {
  question: string;
  stationName?: string;
  latestMeasurements?: Record<string, unknown>;
}

export interface CopilotResult {
  answer: string;
  modelId: string;
  provenance: "AI_GENERATED";
}

export async function generateCopilotAnswer(
  input: CopilotInput
): Promise<CopilotResult> {
  const question = input.question?.trim();

  if (!question || question.length > 4000) {
    throw new Error("Question must contain 1–4000 characters.");
  }

  const modelId =
    process.env.BEDROCK_MODEL_ID || "us.amazon.nova-micro-v1:0";

  const context = JSON.stringify({
    stationName: input.stationName ?? "Not specified",
    latestMeasurements: input.latestMeasurements ?? {}
  });

  const command = new ConverseCommand({
    modelId,
    system: [
      {
        text:
          "You are the AERIS air-quality information assistant. " +
          "Explain supplied measurements cautiously. " +
          "Never invent measurements, observations, forecasts, or official advisories. " +
          "Clearly state when information is missing. " +
          "Do not present demo or simulated data as measured data. " +
          "Offer general precautionary information, not medical diagnosis."
      }
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            text:
              `Station and measurement context: ${context}\n\n` +
              `User question: ${question}`
          }
        ]
      }
    ],
    inferenceConfig: {
      maxTokens: 600,
      temperature: 0.2
    }
  });

  const response = await client.send(command);

  const answer = response.output?.message?.content
    ?.map((block) => ("text" in block ? block.text ?? "" : ""))
    .join("")
    .trim();

  if (!answer) {
    throw new Error("Bedrock returned an empty response.");
  }

  return {
    answer,
    modelId,
    provenance: "AI_GENERATED"
  };
}
