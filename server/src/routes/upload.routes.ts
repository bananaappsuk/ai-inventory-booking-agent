import { Router } from "express";
import * as uploadController from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);
router.post("/", upload.single("photo"), uploadController.uploadPhoto);

export default router;
