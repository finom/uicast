import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { allDefinitions } from "@uicast/shadcn-catalog/defs";
import { domainTools } from "@/tools";

// The system prompt for page generation. Shared between the generate endpoint
// and the page view's prompt viewer, so the viewer shows exactly what the
// endpoint sends. The chat route assembles its own (answer-scoped) variant.
export function buildPageSystemPrompt() {
  return [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "page" }),
    getExpressionsPartialPrompt(),
    getComponentsPartialPrompt({
      definitions: allDefinitions,
    }),
    getFunctionsPartialPrompt({ functions: domainTools }),
  ].join("\n\n");
}
