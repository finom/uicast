import { Evaluator } from "@uicast/expr";
import { domainTools } from "@/tools";
import { delay } from "@/tools/delay";

// One for the app: it holds the parse cache.
export const evaluator = new Evaluator({ functions: [...domainTools, delay] });
