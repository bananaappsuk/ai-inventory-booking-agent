import { Router } from "express";
import { z } from "zod";
import * as inventoryController from "../controllers/inventory.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  totalQuantity: z.number().int().min(0)
});

const updateSchema = createSchema.partial();

router.use(requireAuth);

router.get("/", inventoryController.list);
router.get("/:id", inventoryController.getOne);
router.get("/:id/availability", inventoryController.availability);

router.post("/", requireRole("admin"), validateBody(createSchema), inventoryController.create);
router.patch("/:id", requireRole("admin"), validateBody(updateSchema), inventoryController.update);
router.patch("/:id/hide", requireRole("admin"), inventoryController.hide);
router.patch("/:id/unhide", requireRole("admin"), inventoryController.unhide);
router.delete("/:id", requireRole("admin"), inventoryController.remove);

router.post("/:id/photos", requireRole("admin"), upload.array("photos", 6), inventoryController.addPhotos);
router.delete("/:id/photos/:publicId", requireRole("admin"), inventoryController.removePhoto);

export default router;
