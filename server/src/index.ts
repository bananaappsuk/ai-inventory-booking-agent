import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { startCronJobs } from "./jobs/cron.js";

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();
  startCronJobs();
  app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});
