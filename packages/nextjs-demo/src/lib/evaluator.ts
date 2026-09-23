import { Evaluator } from "@uicast/expr";
import { domainTools } from "@/tools";

// One for the app: it holds the parse cache.
export const evaluator = new Evaluator({ functions: domainTools });
