import cron from "node-cron";
import { runReminderJobs } from "./reminders.job.js";

export function startCronJobs(): void {
  // Daily at 07:07 server time — avoids the top-of-hour thundering herd.
  cron.schedule("7 7 * * *", () => {
    runReminderJobs()
      .then((result) => console.log("[cron] reminder jobs ran", result))
      .catch((err) => console.error("[cron] reminder jobs failed", err));
  });
}
