import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname, basename, join } from "path";
import { glob } from "glob";

// Scoped to the two packages that ship prompt fragments: core's md/ folder and
// expr's prompt/ folder. Keeping the scan this narrow avoids mirroring
// human-facing docs and node_modules READMEs.
const root = dirname(new URL(import.meta.url).pathname);
const srcDirs = [
  resolve(root, "../packages/core/src"),
  resolve(root, "../packages/expr/src"),
];

const mdFiles = [];
for (const srcDir of srcDirs) {
  for (const relPath of await glob("**/*.md", { cwd: srcDir })) {
    mdFiles.push([srcDir, relPath]);
  }
}
console.log(`Found ${mdFiles.length} Markdown file(s) to convert:\n`);
for (const [srcDir, relPath] of mdFiles) {
  const fullPath = join(srcDir, relPath);
  const content = readFileSync(fullPath, "utf-8");
  const jsonPath = fullPath.replace(/\.md$/, ".json");
  writeFileSync(jsonPath, JSON.stringify(content));
  console.log(`${relPath} -> ${basename(jsonPath)}`);
}

console.log(`\nConverted ${mdFiles.length} file(s).`);
