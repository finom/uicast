import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import meta from "@/app/_meta.global";
import { namesOf } from "@/components/catalog-groups";
import { BLOCKS, type Blocks, pageMarkdown } from "./context";

const DOCS = path.join(import.meta.dirname, "../app/(docs)");
const blocks = Object.fromEntries(BLOCKS.map((name) => [name, `(${name})`])) as Blocks;
const hidden = Object.keys(meta).filter((key) => (meta[key] as { display?: string }).display === "hidden");

describe("pageMarkdown", () => {
  it("converts every page the context lists", () => {
    const pages = readdirSync(DOCS, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith("page.mdx") && !hidden.some((key) => file.startsWith(`${key}/`)))
      .map((file) => [file, readFileSync(path.join(DOCS, file), "utf8")]);
    expect(pages.length).toBeGreaterThan(20);
    for (const [file, mdx] of pages) {
      const prose = pageMarkdown(mdx, `https://uicast.dev/${file}`, blocks).replace(/^(`{3,})[\s\S]*?^\1$/gm, "");
      expect(prose, file).not.toMatch(/^import\s.*\sfrom\s+["']|\{\/\*|\0/m);
    }
  });

  it("keeps code, drops JSX and makes links absolute", () => {
    const mdx = [
      "---\ntitle: T\n---",
      'import { Callout } from "nextra/components";',
      "# T",
      "<Steps />",
      '<Callout type="warning">\nMind `<RendererProvider>` and `call(){:ts}`.\n</Callout>',
      "| a | <nobr>b c</nobr> |",
      'The [renderer](/react/renderer) and [below](#x). <GroupSize group="layout" /> layout components.',
      '```tsx\nimport { A } from "a";\n<Hero />\n```',
    ].join("\n\n");
    expect(pageMarkdown(mdx, "https://uicast.dev/t", blocks)).toBe(
      [
        "# T",
        "(Steps)",
        "Mind `<RendererProvider>` and `call()`.",
        "| a | b c |",
        `The [renderer](https://uicast.dev/react/renderer) and [below](https://uicast.dev/t#x). ${namesOf("layout").length} layout components.`,
        '```tsx\nimport { A } from "a";\n<Hero />\n```',
      ].join("\n\n"),
    );
  });

  it("throws on a component with no stand-in", () => {
    expect(() => pageMarkdown("<Chart />", "https://uicast.dev/t", blocks)).toThrow("<Chart> has no Markdown stand-in");
  });
});
