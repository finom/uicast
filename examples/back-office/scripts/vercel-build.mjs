import { execSync } from "node:child_process";

// Preview deploys share the production database, so only a production build touches the schema and the demo account.
// `--force`: a build has no one to answer drizzle-kit's data-loss prompt.

const run = (command) => execSync(command, { stdio: "inherit" });

if (process.env.VERCEL_ENV === "production") {
  run("npm run db:push -- --force");
  // Updates the demo account in place, so its row ids and shared links survive.
  run("npm run db:seed");
}

run("next build");
