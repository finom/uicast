// Pins internal @uicast/* dependency ranges of the publishable packages to
// the exact workspace versions. `*` doesn't resolve on the registry when
// only prerelease versions exist, so the all-packages release flow rewrites
// the ranges right after the version bumps.
import { readFileSync, writeFileSync } from "node:fs";

const read = (dir) => JSON.parse(readFileSync(`./packages/${dir}/package.json`, "utf8"));
const versions = {
  "@uicast/core": read("core").version,
  "@uicast/react": read("react").version,
  "@uicast/shadcn-catalog": read("shadcn-catalog").version,
  "@uicast/streamdown": read("streamdown").version,
};

for (const dir of ["react", "shadcn-catalog", "streamdown"]) {
  const path = `./packages/${dir}/package.json`;
  const manifest = read(dir);
  let changed = false;
  for (const deps of [manifest.dependencies, manifest.peerDependencies]) {
    if (!deps) continue;
    for (const name of Object.keys(deps)) {
      if (name in versions && deps[name] !== versions[name]) {
        deps[name] = versions[name];
        changed = true;
      }
    }
  }
  if (changed) writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`${dir}: ${changed ? "pinned" : "up to date"}`);
}
