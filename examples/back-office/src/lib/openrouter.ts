import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { User } from "@/db/schema";
import { decryptSecret } from "./crypto";

export const GENERATION_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-opus-5.5";
export const MAX_OUTPUT_TOKENS = 62_000;

// OpenRouter's automatic prompt caching: a prefix repeated within 5 minutes bills at the cache-read price.
export const PROMPT_CACHING = { openrouter: { cache_control: { type: "ephemeral" } } };

export function modelForUser(user: User) {
  if (!user.openrouterKeyEnc) return null;
  const openrouter = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: decryptSecret(user.openrouterKeyEnc),
  });
  return openrouter.chatModel(GENERATION_MODEL);
}
