// `PACKAGE=<dir> npm run patch|minor` releases one package, `PACKAGE=all` every one. After the gates it bumps the
// versions, commits, and pushes a `<dir>-v<version>` tag per package. The tag push runs publish.yml, which publishes.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DIRS = ["expr", "core", "react", "shadcn-catalog", "streamdown"];
const type = process.argv[2];
const target = process.env.PACKAGE || "core";
const dirs = target === "all" ? DIRS : [target];
if (!["patch", "minor"].includes(type) || !dirs.every((dir) => DIRS.includes(dir))) {
  throw new Error("Usage: PACKAGE=<dir>|all npm run patch|minor");
}

const sh = (command) => execSync(command, { stdio: "inherit" });
if (execSync("git status --porcelain", { encoding: "utf8" }).trim()) {
  throw new Error("The tree is not clean; the release makes its own commit.");
}

sh("npm test && npm run typecheck && npm run lint && npm run build");
for (const dir of dirs) sh(`npm version ${type} --no-git-tag-version --prefix packages/${dir}`);
sh("node scripts/sync-internal-deps.mjs");

const released = dirs.map((dir) => ({ dir, ...JSON.parse(readFileSync(`packages/${dir}/package.json`, "utf8")) }));
sh(`git commit -am "chore(release): ${released.map(({ name, version }) => `${name}@${version}`).join(", ")}"`);
sh("git push");
// One tag per push: GitHub runs no workflow for a push of more than three tags.
for (const { dir, version } of released) sh(`git tag ${dir}-v${version} && git push origin ${dir}-v${version}`);
