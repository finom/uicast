// Run on predev / prebuild: the body of every MDX fence with localpath="<path from repo root>" becomes that file's content.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve("../..");

function parseAttrs(fenceLine) {
  const attrs = {};
  const re = /([a-zA-Z0-9_-]+)=(?:"([^"]+)"|'([^']+)'|([^\s"']+))/g;
  for (let m = re.exec(fenceLine); m; m = re.exec(fenceLine)) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

async function updateSnippets(mdx) {
  const blockRe = /```(?<fenceLine>[^\n]*)\n[\s\S]*?\n```/g;
  const matches = [];
  for (let m = blockRe.exec(mdx); m; m = blockRe.exec(mdx)) matches.push(m);

  let out = "";
  let last = 0;
  for (const match of matches) {
    const { index } = match;
    const { fenceLine } = match.groups;
    out += mdx.slice(last, index);
    last = index + match[0].length;

    const { localpath } = parseAttrs(fenceLine);

    if (localpath) {
      // MDX's compiler trips on a leading use-client/use-server directive even
      // inside a fence (it mis-marks the module), so drop it from the snippet.
      const body = (await readFile(path.join(REPO_ROOT, localpath), "utf8"))
        .trim()
        .replace(/^["']use (?:client|server)["'];?[ \t]*\n+/, "");
      out += `\`\`\`${fenceLine}\n${body}\n\`\`\``;
      continue;
    }

    out += match[0];
  }
  out += mdx.slice(last);
  return out;
}

async function collectMdx(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await collectMdx(full, acc);
    else if (e.isFile() && full.toLowerCase().endsWith(".mdx")) acc.push(full);
  }
  return acc;
}

const files = await collectMdx(path.join(process.cwd(), "src"));
let changed = 0;
for (const file of files) {
  const original = await readFile(file, "utf8");
  const next = await updateSnippets(original);
  if (next !== original) {
    await writeFile(file, next, "utf8");
    console.info(`synced ${path.relative(process.cwd(), file)}`);
    changed++;
  }
}
console.info(`MDX snippets: ${changed}/${files.length} file(s) updated.`);
