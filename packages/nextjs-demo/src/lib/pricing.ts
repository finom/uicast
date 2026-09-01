import { GENERATION_MODEL } from "./openrouter";

// Per-token USD prices for the generation model, from OpenRouter's own model
// listing — so the estimate uses the exact rates OpenRouter bills, whatever
// the model. Cached for an hour; a fetch failure means "no price", never a
// made-up number.

type Pricing = { promptUsd: number; completionUsd: number };

let cached: { at: number; pricing: Pricing | null } | undefined;

export async function getModelPricing(): Promise<Pricing | null> {
  if (cached && Date.now() - cached.at < 3_600_000) return cached.pricing;
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
