import { execSync } from "node:child_process";

// Vercel runs this instead of `build`. Preview deploys share the production
// database, so only a production build touches the schema and the demo account.
// `--force` because a build has no one to answer drizzle-kit's data-loss prompt.

const run = (command) => execSync(command, { stdio: "inherit" });

if (process.env.VERCEL_ENV === "production") {
  run("npm run db:push -- --force");
  // `--if-empty`: reseeding would recreate the demo account under new row ids
  // and break every link already shared to one of its pages.
  run("npm run db:seed -- --if-empty");
}

run("next build");
