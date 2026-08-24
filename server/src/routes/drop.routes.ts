import { Router } from "express";
import { z } from "zod";
import * as dropController from "../controllers/drop.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router({ mergeParams: true });

const photoSchema = z.object({ url: z.string().min(1), publicId: z.string().min(1) });

const submitSchema = z.object({
  overallNote: z.string().optional(),
  items: z.array(
    z.object({
      inventoryItem: z.string().min(1),
      returned: z.boolean(),
      quantityReturned: z.number().int().min(0),
      note: z.string().optional(),
      photos: z.array(photoSchema).optional()
    })
  )
});

router.use(requireAuth);

router.get("/", dropController.getDrop);
router.post("/", validateBody(submitSchema), dropController.submitDrop);

export default router;
