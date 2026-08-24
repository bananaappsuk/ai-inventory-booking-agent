import { Router } from "express";
import { z } from "zod";
import * as dropApprovalController from "../controllers/dropApproval.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { CONDITIONS } from "../models/Booking.js";

const router = Router({ mergeParams: true });

const photoSchema = z.object({ url: z.string().min(1), publicId: z.string().min(1) });
const conditionEnum = z.enum(CONDITIONS);

const submitSchema = z.object({
  overallCondition: conditionEnum,
  overallNote: z.string().optional(),
  adminPhotos: z.array(photoSchema).optional(),
  items: z
    .array(
      z.object({
        inventoryItem: z.string().min(1),
        condition: conditionEnum,
        note: z.string().optional(),
        photos: z.array(photoSchema).optional()
      })
    )
    .optional()
});

router.use(requireAuth, requireRole("admin"));

router.get("/", dropApprovalController.getOne);
router.post("/", validateBody(submitSchema), dropApprovalController.submit);

export default router;
