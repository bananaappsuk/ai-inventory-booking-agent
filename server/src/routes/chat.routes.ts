import { Router } from "express";
import { z } from "zod";
import * as chatController from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

const messageSchema = z.object({ text: z.string().min(1) });

router.use(requireAuth);

router.post("/sessions", chatController.createSession);
router.get("/sessions", chatController.listSessions);
router.get("/sessions/:id/messages", chatController.getMessages);
router.post("/sessions/:id/messages", validateBody(messageSchema), chatController.postMessage);

export default router;
