import { Router } from "express";
import * as dropApprovalController from "../controllers/dropApproval.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { runReminderJobs } from "../jobs/reminders.job.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/check-inventory", dropApprovalController.listPending);

router.post(
  "/jobs/run-reminders",
  asyncHandler(async (_req, res) => {
    const result = await runReminderJobs();
    res.json(result);
  })
);

export default router;
