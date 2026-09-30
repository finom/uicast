import { readFile } from "node:fs/promises";
import path from "node:path";
import { getFunctionsPartialPrompt } from "@uicast/core/prompt";
import { ALT } from "@/components/hero-illustration";
import { EXAMPLES } from "@/components/replay/examples";
import { functions } from "@/components/replay/functions";
import { STEPS } from "@/components/steps";
import { type Blocks, fence, pageMarkdown } from "@/lib/context";
import { docsPages } from "@/lib/docs-pages";
import { parts as counter } from "@/lib/mini-examples/counter";
import { PROV } from "@/lib/mini-examples/entry-variants";
import type { CodePart } from "@/lib/mini-examples/mini-example";
import { parts as orders } from "@/lib/mini-examples/orders";
import { parts as tracker } from "@/lib/mini-examples/tracker";
import { parts as weather } from "@/lib/mini-examples/weather";
import { SITE } from "@/lib/site";

// Every docs page in sidebar order, as one Markdown file for an LLM. The static export writes it to a file.
export const dynamic = "force-static";

const SRC = path.join(process.cwd(), "src");

const jsonLines = (entries: unknown[]) => fence("jsonl", entries.map((entry) => JSON.stringify(entry)).join("\n"));

// A mini example as the parts its tabs show; a part backed by a file prints the file.
async function miniExample(dir: string, { entry, setup }: { entry: CodePart; setup: CodePart[] }) {
  const entries = entry.variants?.find((variant) => variant.label === "JSONLines")?.code ?? "";
  const parts = await Promise.all(
    setup.map(async ({ name, file, prov, code = "", lang = "" }) => {
      const label = `**${name}**${file ? `, \`${file}\`` : ""} (${PROV[prov]}):`;
      if (!file) return `${label}\n\n${fence(lang, code)}`;
      const source = await readFile(path.join(SRC, "lib/mini-examples", dir, file), "utf8");
      return `${label}\n\n${fence(path.extname(file).slice(1), source)}`;
    }),
  );
  return [`**${entry.name}** (${PROV[entry.prov]}):\n\n${fence("jsonl", entries)}`, ...parts].join("\n\n");
}

export async function GET() {
  const blocks: Blocks = {
    Steps: STEPS.map(({ title, body }, i) => `${i + 1}. **${title}.** ${body}`).join("\n"),
    HeroIllustration: `![${ALT}](${SITE}/uicast-hero-light.svg)`,
    Replay: [
      "The demo's prompts, each with the entries the model wrote for it. The entries call these host functions:",
      fence("md", getFunctionsPartialPrompt({ functions })),
      ...EXAMPLES.map(({ prompt, lines }) => `Prompt: ${prompt}\n\n${jsonLines(lines)}`),
    ].join("\n\n"),
    CounterExample: await miniExample("counter", counter),
    TrackerExample: await miniExample("tracker", tracker),
    WeatherExample: await miniExample("weather", weather),
    OrdersExample: await miniExample("orders", orders),
  };
  const pages = (await docsPages()).map(({ route, mdx }) => {
    const url = SITE + route;
    return `Page: ${url}\n\n${pageMarkdown(mdx, url, blocks)}`;
  });
  const body = pages.join("\n\n---\n\n");
  const header = [
    "---",
    "title: uicast documentation",
    "description: The expression-driven generative UI framework.",
    `pages: ${pages.length}`,
    `chars: ${body.length}`,
    `est_tokens: ${Math.ceil(body.length / 4)}`,
    "---",
  ].join("\n");
  return new Response(`${header}\n\n${body}\n`, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
