import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelUsage } from "ai";
import type { User } from "@/db/schema";
import { decryptSecret } from "./crypto";

export const GENERATION_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-opus-5.5";
export const MAX_OUTPUT_TOKENS = 62_000;

// OpenRouter caches the prompt up to its last block; the session pins the provider that holds that cache. A 1-hour
// write costs 2× the input price, a 5-minute one 1.25×.
export const caching = (sessionId: string, ttl?: "1h") => ({
  openrouter: { cache_control: { type: "ephemeral", ...(ttl && { ttl }) }, session_id: sessionId },
});

// What OpenRouter charged for one step: its usage report, which comes with every response, carries the cost.
export function chargedUsd(usage: LanguageModelUsage): number | null {
  const cost = usage.raw?.cost;
  return typeof cost === "number" ? cost : null;
}

export function modelForUser(user: User) {
  if (!user.openrouterKeyEnc) return null;
  const openrouter = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: decryptSecret(user.openrouterKeyEnc),
  });
  return openrouter.chatModel(GENERATION_MODEL);
}
