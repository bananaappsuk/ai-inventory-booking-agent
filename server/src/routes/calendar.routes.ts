import { Router } from "express";
import * as calendarController from "../controllers/calendar.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/bookings", calendarController.listCalendarBookings);
router.patch("/bookings/:id/move", requireRole("admin"), calendarController.moveBooking);

export default router;
