import { Router, type Request, type Response, type NextFunction } from "express";

import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../lib/multer";

const router = Router();

const conditionalUpload = (fields: { name: string; maxCount: number }[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.startsWith("multipart/form-data")) {
      return upload.fields(fields)(req, res, next);
    }
    next();
  };
};

router.post(
  "/",
  conditionalUpload([{ name: "image", maxCount: 1 }]),
  validateRequest(CategoryValidation.createCategorySchema),
  CategoryController.createCategory,
);

router.get("/", CategoryController.getAllCategories);

router.get("/slug/:slug", CategoryController.getCategoryBySlug);

router.get("/:id", CategoryController.getCategoryById);

router.patch(
  "/:id",
  conditionalUpload([{ name: "image", maxCount: 1 }]),
  validateRequest(CategoryValidation.updateCategorySchema),
  CategoryController.updateCategory,
);

router.delete("/:id", CategoryController.deleteCategory);

export const CategoryRoutes = router;