import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
  getExpressionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { defs } from "@uicast/shadcn-catalog/all-defs";
import { domainTools } from "@/tools";

// The system prompt for page generation. Shared between the generate endpoint
// and the page view's prompt viewer, so the viewer shows exactly what the
// endpoint sends. The chat route assembles its own (answer-scoped) variant.
export function buildPageSystemPrompt() {
  return [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "page" }),
    getComponentsPartialPrompt({
      definitions: defs,
    }),
    getFunctionsPartialPrompt({ functions: domainTools }),
    getExpressionsPartialPrompt(),
  ].join("\n\n");
}
