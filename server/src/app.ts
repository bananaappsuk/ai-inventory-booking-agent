import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import pickupRoutes from "./routes/pickup.routes.js";
import dropRoutes from "./routes/drop.routes.js";
import dropApprovalRoutes from "./routes/dropApproval.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import chatRoutes from "./routes/chat.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/bookings/:id/pickup", pickupRoutes);
  app.use("/api/bookings/:id/drop", dropRoutes);
  app.use("/api/bookings/:id/drop-approval", dropApprovalRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/calendar", calendarRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/chat", chatRoutes);

  app.use(errorHandler);

  return app;
}
