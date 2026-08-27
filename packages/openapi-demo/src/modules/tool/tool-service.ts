import { HttpException, HttpStatus, type VovkBody } from "vovk";
import { findTool, resolveRegistry } from "@/connections/registry";
import type ToolController from "./tool-controller";

/**
 * The browser's door to a connected API.
 *
 * A generated document's expressions run client-side, so its host functions
 * cannot perform the API call themselves — the credential lives on this side.
 * They post here instead, and the credential never leaves the server.
 */
export default class ToolService {
  /**
   * What the model can call right now: one entry per derived operation, with
   * the JSON Schemas the prompt is built from.
   */
  static getTools = async () => {
    const { tools, failures } = await resolveRegistry();
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema:
          (tool.inputSchema?.["~standard"].jsonSchema.input({ target: "draft-2020-12" }) as
            | Record<string, unknown>
            | undefined) ?? null,
        outputSchema:
          (tool.outputSchema?.["~standard"].jsonSchema.output({ target: "draft-2020-12" }) as
            | Record<string, unknown>
            | undefined) ?? null,
      })),
      failures,
    };
  };

  static callTool = async (body: VovkBody<typeof ToolController.callTool>) => {
    const tool = await findTool(body.name);
    if (!tool) throw new HttpException(HttpStatus.NOT_FOUND, `No connected tool named ${body.name}`);
    try {
      return { result: await tool.execute(body.input ?? {}) };
    } catch (error) {
      // The upstream body is not relayed — it can quote the credential we sent.
      throw new HttpException(
        HttpStatus.BAD_GATEWAY,
        error instanceof Error ? error.message : "The API call failed",
      );
    }
  };
}
