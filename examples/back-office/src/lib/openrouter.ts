import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { User } from "@/db/schema";
import { decryptSecret } from "./crypto";

export const GENERATION_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-opus-5.5";
export const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 62_000);

export function modelForUser(user: User) {
  if (!user.openrouterKeyEnc) return null;
  const openrouter = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: decryptSecret(user.openrouterKeyEnc),
  });
  return openrouter.chatModel(GENERATION_MODEL);
}
