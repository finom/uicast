import { GENERATION_MODEL } from "./openrouter";

// Rates from OpenRouter's own model listing; a fetch failure means "no price", never a made-up number.

type Pricing = { promptUsd: number; completionUsd: number };

const PRICING_TTL_MS = 3_600_000;

let cached: { at: number; pricing: Pricing | null } | undefined;

export async function getModelPricing(): Promise<Pricing | null> {
  if (cached && Date.now() - cached.at < PRICING_TTL_MS) return cached.pricing;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { accept: "application/json" },
    });
    const body = (await res.json()) as {
      data?: { id: string; pricing?: { prompt?: string; completion?: string } }[];
    };
    const model = body.data?.find((m) => m.id === GENERATION_MODEL);
    const prompt = Number(model?.pricing?.prompt);
    const completion = Number(model?.pricing?.completion);
    const pricing =
      Number.isFinite(prompt) && Number.isFinite(completion) ? { promptUsd: prompt, completionUsd: completion } : null;
    cached = { at: Date.now(), pricing };
    return pricing;
  } catch {
    cached = { at: Date.now(), pricing: null };
    return null;
  }
}

export function computeCostUsd(
  pricing: Pricing | null,
  inputTokens: number,
  outputTokens: number,
): number | null {
  if (!pricing) return null;
  return inputTokens * pricing.promptUsd + outputTokens * pricing.completionUsd;
}
