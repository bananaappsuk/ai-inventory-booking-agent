import { Router } from "express";
import { z } from "zod";
import * as authController from "../controllers/auth.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const bootstrapSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

router.post("/signup", validateBody(signupSchema), authController.signup);
router.post("/login", validateBody(loginSchema), authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/admin/bootstrap", optionalAuth, validateBody(bootstrapSchema), authController.adminBootstrap);

export default router;
