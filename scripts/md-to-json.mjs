import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname, basename, join } from "path";
import { glob } from "glob";

// Scoped to core source only: the sole md-to-json consumers are the prompt
// fragments under packages/core/src/prompt/md/. Keeping the scan this narrow
// avoids mirroring human-facing docs and node_modules READMEs.
const srcDir = resolve(
  dirname(new URL(import.meta.url).pathname),
  "../packages/core/src",
);

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
