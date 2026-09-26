import { createTextStreamResponse, streamText } from "ai";
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { defs } from "@uicast/shadcn-catalog/all/defs";
import { tools } from "@/tools";

const system = [
  getCommonInstructionsPartialPrompt(),
  getScopePartialPrompt({ kind: "page" }),
  getComponentsPartialPrompt({ definitions: defs }),
  getFunctionsPartialPrompt({ functions: tools }),
  getExpressionsPartialPrompt(),
].join("\n\n");

export async function POST(req: Request) {
  const { prompt } = await req.json();
  // A bare model id resolves through the Vercel AI Gateway — set AI_GATEWAY_API_KEY.
  const result = streamText({ model: "anthropic/claude-opus-5.5", system, prompt });

  return createTextStreamResponse({
    stream: result.textStream,
    headers: { "content-type": "application/jsonl; charset=utf-8" },
  });
}
