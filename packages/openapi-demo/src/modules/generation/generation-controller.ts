import { type ModelMessage, streamText } from "ai";
import { buildElementsById, type ComponentEntry, streamJsonLines } from "@uicast/core";
import { getEditRequestPrompt } from "@uicast/core/prompt";
import { JSONLinesResponder, operation, post, prefix, type VovkRequest } from "vovk";
import { buildSystemPrompt } from "@/connections/system-prompt";
import GenerationService from "./generation-service";

// Plain string model ids resolve through the Vercel AI Gateway (set AI_GATEWAY_API_KEY).
const GENERATION_MODEL = process.env.AI_MODEL ?? "anthropic/claude-opus-5";
// Providers default to a small output cap (Anthropic: 4096 tokens ≈ ~40
// entries), which truncates large pages mid-subtree. Set it explicitly.
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 32_000);

/** One line of the generation stream: an entry, or a control line carrying `type`. */
export type GenerateLine =
  | ComponentEntry
  | { type: "warning"; warning: string }
  | { type: "error"; error: string }
  | { type: "done"; pageId: number; finishReason?: string };

function isEntry(value: unknown): value is ComponentEntry {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as ComponentEntry).key === "string" &&
    typeof (value as ComponentEntry).component === "string"
  );
}

@prefix("generation")
export default class GenerationController {
  @operation({
    summary: "Generate a page",
    description:
      "Streams JSONLines: one line per element as the model emits it, then a `done` control line. A page that already has entries is edited rather than regenerated.",
  })
  @post("generate")
  static async generate(req: VovkRequest<{ pageId: number; prompt: string }>) {
    const { pageId, prompt } = await req.json();
    const page = await GenerationService.getPage(pageId);
    const stored = await GenerationService.getEntries(pageId);

    // Edit mode replays the page's current JSONL as the model's own prior turn,
    // so the request reads as "modify your previous output". Children referenced
    // but never emitted (a truncated earlier run) are named in the edit request
    // so the model re-emits them instead of keeping them by reference.
    const byKey = buildElementsById(stored);
    const missingKeys = [
      ...new Set(
        Object.values(byKey)
          .flatMap((entry) => entry.children ?? [])
          .filter((key) => !byKey[key]),
      ),
    ];
    const messages: ModelMessage[] = stored.length
      ? [
          { role: "user", content: `Page title: ${page.title}\n\n${page.prompt ?? ""}` },
          { role: "assistant", content: stored.map((entry) => JSON.stringify(entry)).join("\n") },
          { role: "user", content: getEditRequestPrompt({ request: prompt, missingKeys }) },
        ]
      : [{ role: "user", content: `Page title: ${page.title}\n\n${prompt}` }];

    const system = await buildSystemPrompt({ scopeKind: "page" });
    const response = new JSONLinesResponder<GenerateLine>(req);

    void (async () => {
      try {
        let streamError: unknown = null;
        const result = streamText({
          model: GENERATION_MODEL,
          system,
          messages,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          onError: ({ error }) => {
            streamError = error;
          },
        });

        // Persist and relay each entry the moment its line completes.
        for await (const value of streamJsonLines(result.textStream)) {
          if (!isEntry(value)) continue;
          await GenerationService.appendEntry(pageId, value);
          await response.send(value);
        }

        await GenerationService.pruneShadowedEntries(pageId);

        // "length" / "content-filter" explains a stream that ends after a few entries.
        const finishReason = await Promise.resolve(result.finishReason).catch(() => "unknown");
        if (streamError) {
          const message = streamError instanceof Error ? streamError.message : String(streamError);
          await response.send({ type: "error", error: message });
        }
        await response.send({ type: "done", pageId, finishReason });
      } catch (err) {
        await response.send({
          type: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        response.close();
      }
    })();

    return response;
  }
}
