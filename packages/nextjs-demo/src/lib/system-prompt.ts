import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { defs } from "@uicast/shadcn-catalog/all/defs";
import { domainTools } from "@/tools";

// The page view's prompt viewer builds it too, so it shows exactly what the endpoint sends.
export const buildSystemPrompt = (kind: "page" | "answer", ...extra: string[]) =>
  [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind }),
    getComponentsPartialPrompt({ definitions: defs }),
    getFunctionsPartialPrompt({ functions: domainTools }),
    getExpressionsPartialPrompt(),
    ...extra,
  ].join("\n\n");
