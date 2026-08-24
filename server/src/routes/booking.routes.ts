import { Router } from "express";
import { z } from "zod";
import * as bookingController from "../controllers/booking.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

const createSchema = z.object({
  eventTitle: z.string().min(1),
  eventDate: z.string().min(1),
  session: z.enum(["AM", "PM"]),
  items: z.array(z.object({ inventoryItem: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
  bookedByUserId: z.string().optional()
});

const updateSchema = z.object({
  eventTitle: z.string().min(1).optional(),
  eventDate: z.string().min(1).optional(),
  session: z.enum(["AM", "PM"]).optional()
});

const rejectSchema = z.object({ note: z.string().min(1) });
const approveSchema = z.object({ note: z.string().optional() });
const rescheduleSchema = z.object({ eventDate: z.string().min(1), session: z.enum(["AM", "PM"]) });

router.use(requireAuth);

router.post("/", validateBody(createSchema), bookingController.create);
router.get("/", bookingController.list);
router.get("/:id", bookingController.getOne);
router.patch("/:id", validateBody(updateSchema), bookingController.update);
router.delete("/:id", bookingController.remove);

router.patch("/:id/approve", requireRole("admin"), validateBody(approveSchema), bookingController.approve);
router.patch("/:id/reject", requireRole("admin"), validateBody(rejectSchema), bookingController.reject);
router.patch(
  "/:id/reschedule",
  requireRole("admin"),
  validateBody(rescheduleSchema),
  bookingController.reschedule
);

export default router;
