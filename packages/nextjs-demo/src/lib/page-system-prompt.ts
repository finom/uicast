import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
  getExpressionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import * as catalogDefs from "@uicast/shadcn-catalog/all/defs";
import { domainTools } from "@/tools";

// Shared with the page view's prompt viewer, so the viewer shows exactly what the endpoint sends.
export function buildPageSystemPrompt() {
  return [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: "page" }),
    getComponentsPartialPrompt({
      definitions: Object.values(catalogDefs),
    }),
    getFunctionsPartialPrompt({ functions: domainTools }),
    getExpressionsPartialPrompt(),
  ].join("\n\n");
}
