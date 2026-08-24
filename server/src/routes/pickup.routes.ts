import { Router } from "express";
import { z } from "zod";
import * as pickupController from "../controllers/pickup.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router({ mergeParams: true });

const photoSchema = z.object({ url: z.string().min(1), publicId: z.string().min(1) });

const submitSchema = z.object({
  overallNote: z.string().optional(),
  items: z.array(
    z.object({
      inventoryItem: z.string().min(1),
      pickedUp: z.boolean(),
      quantityPickedUp: z.number().int().min(0),
      note: z.string().optional(),
      photos: z.array(photoSchema).optional()
    })
  )
});

router.use(requireAuth);

router.get("/", pickupController.getPickup);
router.post("/", validateBody(submitSchema), pickupController.submitPickup);

export default router;
