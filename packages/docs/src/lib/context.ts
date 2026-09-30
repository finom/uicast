import { namesOf } from "@/components/catalog-groups";

export const SITE = "https://uicast.dev";

// Live components on the docs pages, each with a Markdown stand-in the context route builds.
export const BLOCKS = [
  "Steps",
  "HeroIllustration",
  "Replay",
  "CounterExample",
  "TrackerExample",
  "WeatherExample",
  "OrdersExample",
] as const;
export type Blocks = Record<(typeof BLOCKS)[number], string>;

// Nothing here the file's header doesn't say.
const DROPPED = ["Hero", "Sponsors"];
// The tags go, the text inside stays.
const UNWRAPPED = ["Bleed", "Callout", "ShowMore"];

// A fence long enough for code that holds fences itself.
export const fence = (lang: string, code: string) => {
  const ticks = "`".repeat(Math.max(3, ...Array.from(code.matchAll(/`+/g), ([run]) => run.length + 1)));
  return `${ticks}${lang}\n${code.trim()}\n${ticks}`;
};

// One docs page as plain Markdown: no front matter, imports or JSX, and absolute links. Code keeps its text.
// A component with no stand-in throws, so a new one can't drop out of the context unnoticed.
export function pageMarkdown(mdx: string, url: string, blocks: Blocks): string {
  const kept: string[] = [];
  const keep = (text: string) => `\0${kept.push(text) - 1}\0`;
  const component = (name: string) => {
    if (name in blocks) return keep(blocks[name as keyof Blocks]);
    if (DROPPED.includes(name)) return "";
    throw new Error(`${url}: <${name}> has no Markdown stand-in`);
  };
  return mdx
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/^[ \t]*(`{3,})[\s\S]*?^[ \t]*\1[ \t]*$/gm, keep)
    .replace(/(`+)[\s\S]*?[^`]\1(?!`)/g, (code) => keep(code.replace(/\{:\w+\}(?=`+$)/, "")))
    .replace(/^import\s+(?:[\w*{}\s,]+\s+from\s+)?["'][^"']+["'];?[ \t]*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/<GroupSize group="(\w+)" \/>/g, (_, group) => String(namesOf(group).length))
    .replace(/<GroupNames group="(\w+)">[\s\S]*?<\/GroupNames>/g, (_, group) => namesOf(group).join(", "))
    .replace(/<([A-Z]\w*)[^>]*\/>/g, (_, name) => component(name))
    .replace(/<\/?([A-Za-z]\w*)[^>]*>/g, (tag, name) => {
      if (/^[a-z]/.test(name) || UNWRAPPED.includes(name)) return "";
      throw new Error(`${url}: ${tag} has no Markdown stand-in`);
    })
    .replace(/\]\(\/(?!\/)/g, `](${SITE}/`)
    .replace(/\]\(#/g, `](${url}#`)
    .replace(/^[ \t]+(?=\0|$)/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\0(\d+)\0/g, (_, i) => kept[Number(i)])
    .trim();
}
