import type { LanguageModelUsage } from "ai";

// USD per 1M tokens, from OpenRouter's listing. A new model needs its row here; without one, no cost is shown.
const MODEL_PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "anthropic/claude-opus-5.5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
};

// OpenRouter reports cache writes only in its raw usage, so this takes one step's usage, not a total.
export function computeCostUsd(model: string, usage: LanguageModelUsage): number | null {
  const price = MODEL_PRICES[model];
  if (!price) return null;
  const details = usage.raw?.prompt_tokens_details as { cache_write_tokens?: number } | undefined;
  const cacheRead = usage.inputTokenDetails.cacheReadTokens ?? 0;
  const cacheWrite = details?.cache_write_tokens ?? 0;
  const input = (usage.inputTokens ?? 0) - cacheRead - cacheWrite;
  const output = usage.outputTokens ?? 0;
  return (
    (input * price.input + cacheRead * price.cacheRead + cacheWrite * price.cacheWrite + output * price.output) / 1e6
  );
}
