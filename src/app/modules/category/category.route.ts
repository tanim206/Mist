import { Router } from "express";
import { CategoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { CategoryValidation } from "./category.validation";
import { upload } from "../../lib/multer";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  validateRequest(CategoryValidation.createCategorySchema),
  CategoryController.createCategory
);

router.get("/", CategoryController.getAllCategories);

router.get("/slug/:slug", CategoryController.getCategoryBySlug);

router.get("/:id", CategoryController.getCategoryById);

router.patch(
  "/:id",
  upload.single("image"),
  validateRequest(CategoryValidation.updateCategorySchema),
  CategoryController.updateCategory
);

router.delete("/:id", CategoryController.deleteCategory);

export const CategoryRoutes = router;