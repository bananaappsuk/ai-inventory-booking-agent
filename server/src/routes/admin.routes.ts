import { Router } from "express";
import { z } from "zod";
import * as dropApprovalController from "../controllers/dropApproval.controller.js";
import * as authController from "../controllers/auth.controller.js";
import * as adminRulesController from "../controllers/adminRules.controller.js";
import * as adminSettingsController from "../controllers/adminSettings.controller.js";
import * as adminAiLogsController from "../controllers/adminAiLogs.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { runReminderJobs } from "../jobs/reminders.job.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/check-inventory", dropApprovalController.listPending);

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "user"]).optional(),
  phone: z.string().optional()
});

router.get("/users", authController.listAllUsers);
router.post("/users", validateBody(createUserSchema), authController.adminCreateUser);
router.get("/users/pending", authController.listPendingUsers);
router.patch("/users/:id/approve", authController.approveUser);
router.patch("/users/:id/reject", authController.rejectUser);
router.patch("/users/:id/activate", authController.activateUser);
router.patch("/users/:id/deactivate", authController.deactivateUser);

router.post(
  "/jobs/run-reminders",
  asyncHandler(async (_req, res) => {
    const result = await runReminderJobs();
    res.json(result);
  })
);

const ruleUpsertSchema = z.object({
  enabled: z.boolean().optional(),
  params: z.record(z.string(), z.number()).optional(),
  naturalLanguageText: z.string().optional()
});

router.get("/rules", adminRulesController.list);
router.patch("/rules/:ruleType", validateBody(ruleUpsertSchema), adminRulesController.upsert);
router.get("/rules-prompt", adminRulesController.getPrompt);

router.get("/settings/auto-approval", adminSettingsController.getAutoApprovalFlag);
router.patch(
  "/settings/auto-approval",
  validateBody(z.object({ enabled: z.boolean() })),
  adminSettingsController.setAutoApprovalFlag
);

router.get("/ai-logs", adminAiLogsController.list);

export default router;
