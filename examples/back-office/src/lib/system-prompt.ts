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
    getFunctionsPartialPrompt({
      functions: domainTools,
      note: "Each function that creates, updates or deletes data shows a toast when it succeeds. Don't write a Toast entry for it.",
    }),
    getExpressionsPartialPrompt(),
    ...extra,
  ].join("\n\n");
