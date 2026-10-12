// Copied verbatim from standard-tool 0.1.1, with its first import replaced as its README says. Update by re-copying.
import type { StandardJSONSchemaV1, StandardSchemaV1 } from "@standard-schema/spec";

// Portable LLM tool. Schemas may transform: `Input` is the input schema's input side, `Output` the output schema's output side.
export interface StandardToolV0<Input = unknown, Output = unknown, FormattedOutput = Output, Context = unknown> {
  name: string;
  title?: string;
  description: string;
  inputSchema?: StandardSchemaV1<Input, unknown> & StandardJSONSchemaV1<Input, unknown>;
  outputSchema?: StandardSchemaV1<unknown, Output> & StandardJSONSchemaV1<unknown, Output>;
  meta?: Record<string, unknown>;
  execute(input: Input, context?: Context): FormattedOutput | Promise<FormattedOutput>;
}
