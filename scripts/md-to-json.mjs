import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename, join } from "node:path";
import { glob } from "glob";

const srcDir = resolve(import.meta.dirname, "../packages/core/src");

const mdFiles = await glob("**/*.md", { cwd: srcDir });
console.log(`Found ${mdFiles.length} Markdown file(s) to convert:\n`);
for (const relPath of mdFiles) {
  const fullPath = join(srcDir, relPath);
  const content = readFileSync(fullPath, "utf-8");
  const jsonPath = fullPath.replace(/\.md$/, ".json");
  writeFileSync(jsonPath, JSON.stringify(content));
  console.log(`${relPath} -> ${basename(jsonPath)}`);
}

console.log(`\nConverted ${mdFiles.length} file(s).`);
