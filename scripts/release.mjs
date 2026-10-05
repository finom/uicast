// `PACKAGE=<dir> npm run patch|minor` releases one package: after the gates it bumps the version, commits, and pushes a
// `<dir>-v<version>` tag, whose push runs publish.yml. Several packages: one run each, in DIRS order.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DIRS = ["expr", "core", "react", "shadcn-catalog", "streamdown"];
const type = process.argv[2];
const dir = process.env.PACKAGE;
if (!["patch", "minor"].includes(type) || !DIRS.includes(dir)) {
  throw new Error(`Usage: PACKAGE=<${DIRS.join("|")}> npm run patch|minor`);
}

const sh = (command) => execSync(command, { stdio: "inherit" });
const read = (command) => execSync(command, { encoding: "utf8" }).trim();
const manifest = () => JSON.parse(readFileSync(`packages/${dir}/package.json`, "utf8"));
if (read("git status --porcelain")) throw new Error("The tree is not clean; the release makes its own commit.");
// A range bump from an earlier run counts as a change, so a package that depends on a released one goes through.
const last = `${dir}-v${manifest().version}`;
if (!read(`git diff --name-only ${last} -- packages/${dir}`)) {
  throw new Error(`packages/${dir} is unchanged since ${last}`);
}

sh("npm test && npm run typecheck && npm run lint && npm run build");
sh(`npm version ${type} --no-git-tag-version --prefix packages/${dir}`);
sh("node scripts/sync-internal-deps.mjs");

const { name, version } = manifest();
sh(`git commit -am "chore(release): ${name}@${version}"`);
sh("git push");
sh(`git tag ${dir}-v${version} && git push origin ${dir}-v${version}`);
