import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const DOCS = path.join(import.meta.dirname, "../app/(docs)");

// A page without a description gets the site's tagline, the same on every page. Search results cut at about 160.
it("gives every page a description of its own", () => {
  const files = readdirSync(DOCS, { recursive: true, encoding: "utf8" }).filter((file) => file.endsWith("page.mdx"));
  const descriptions = files.map((file) => {
    const frontMatter = readFileSync(path.join(DOCS, file), "utf8").match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
    const description = JSON.parse(frontMatter.match(/^description: (.+)$/m)?.[1] ?? '""') as string;
    expect(description.length, file).toBeGreaterThan(0);
    expect(description.length, file).toBeLessThanOrEqual(160);
    return description;
  });
  expect(new Set(descriptions).size).toBe(files.length);
});
