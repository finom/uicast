// Keeps MDX code blocks in sync with their source files, refreshed on predev /
// prebuild. Two attribute modes on the fence line:
//   localpath="<path from repo root>"        — read a file in this repository
//   filename="<path>" repository="owner/repo" — fetch a file from GitHub (main)
// The block body is rewritten in place. Remote blocks also get a trailing source
// link (the vovk.dev convention); local blocks stay clean for importing.

import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function findRepoRoot(start) {
  let dir = start;
  for (;;) {
    if (existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

const REPO_ROOT = findRepoRoot(process.cwd());

async function githubRaw(filePath, { owner, repo, ref }) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}?t=${Date.now()}`;
  return (await fetch(url)).text();
}

async function getGithubFile(filePath, { owner, repo, ref }) {
  try {
    const resp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}&t=${Date.now()}`,
      { headers: { Accept: "application/vnd.github.VERSION.raw" } },
    );
    if (resp.status !== 200) return githubRaw(filePath, { owner, repo, ref });
    return resp.text();
  } catch {
    return githubRaw(filePath, { owner, repo, ref });
  }
}

function parseAttrs(fenceLine) {
  const attrs = {};
  const re = /([a-zA-Z0-9_-]+)=(?:"([^"]+)"|'([^']+)'|([^\s"']+))/g;
  for (let m = re.exec(fenceLine); m; m = re.exec(fenceLine)) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

async function updateSnippets(mdx) {
  const blockRe =
    /```(?<fenceLine>[^\n]*)\n(?<code>[\s\S]*?)\n```(?<linkLine>\n\*\[[^\n]*\]\([^)]+\)\*?)?/g;
  const matches = [];
  for (let m = blockRe.exec(mdx); m; m = blockRe.exec(mdx)) matches.push(m);

  let out = "";
  let last = 0;
  for (const match of matches) {
    const { index } = match;
    const fenceLine = match.groups?.fenceLine ?? "";
    const code = match.groups?.code ?? "";
    out += mdx.slice(last, index);
    last = index + match[0].length;

    const { localpath, filename, repository } = parseAttrs(fenceLine);

    if (localpath) {
      try {
        // MDX's compiler trips on a leading use-client/use-server directive even
        // inside a fence (it mis-marks the module), so drop it from the snippet.
        const body = (await readFile(path.join(REPO_ROOT, localpath), "utf8"))
          .trim()
          .replace(/^["']use (?:client|server)["'];?[ \t]*\n+/, "");
        out += `\`\`\`${fenceLine}\n${body}\n\`\`\``;
        continue;
      } catch {
        out += match[0];
        continue;
      }
    }

    if (filename && repository) {
      const [owner, repo] = repository.split("/");
      if (owner && repo) {
        try {
          const remote = await getGithubFile(filename, { owner, repo, ref: "main" });
          const body = typeof remote === "string" ? remote.trim() : code;
          const link = `*[The code above is fetched from GitHub repository.](https://github.com/${owner}/${repo}/blob/main/${filename})*`;
          out += `\`\`\`${fenceLine}\n${body}\n\`\`\`\n${link}`;
          continue;
        } catch {
          out += match[0];
          continue;
        }
      }
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
