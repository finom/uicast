import { get, operation, post, prefix, procedure } from "vovk";
import { z } from "zod";
import ToolService from "./tool-service";

const toolInfo = z.object({
  name: z.string().meta({ description: "The identifier a uicast expression calls." }),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()).nullable(),
  outputSchema: z
    .record(z.string(), z.unknown())
    .nullable()
    .meta({ description: "Null when the API declares no response shape for the operation." }),
});

@prefix("tools")
export default class ToolController {
  @operation({
    summary: "List callable operations",
    description: "Every operation of every connected API, derived from its OpenAPI document.",
  })
  @get()
  static getTools = procedure({
    output: z.object({
      tools: z.array(toolInfo),
      failures: z.array(
        z.object({ connectionId: z.number().int(), name: z.string(), error: z.string() }),
      ),
    }),
  }).handle(() => ToolService.getTools());

  @operation({
    summary: "Call an operation",
    description:
      "Runs one derived operation server-side, so the connection's credential never reaches the browser.",
  })
  @post("call")
  static callTool = procedure({
    body: z.object({
      name: z.string().meta({ description: "Tool name, e.g. `stripe_listCharges`." }),
      input: z
        .object({
          body: z.unknown().optional(),
          query: z.unknown().optional(),
          params: z.unknown().optional(),
        })
        .optional(),
    }),
    output: z.object({ result: z.unknown() }),
  }).handle(async (req) => ToolService.callTool(await req.json()));
}
