import { Router } from "express";
import { ProductController } from "./product.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { ProductValidation } from "./product.validation";
import { upload } from "../../lib/multer";

const router = Router();

const conditionalUpload = (fields: { name: string; maxCount: number }[]) => {
  return (req: any, res: any, next: any) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.startsWith("multipart/form-data")) {
      return upload.fields(fields)(req, res, next);
    }
    next();
  };
};

router.post(
  "/",
  conditionalUpload([{ name: "images", maxCount: 10 }]),
  validateRequest(ProductValidation.createProductSchema),
  ProductController.createProduct
);

router.get("/", ProductController.getAllProducts);

router.get("/slug/:slug", ProductController.getProductBySlug);

router.get("/:id", ProductController.getProductById);

router.patch(
  "/:id",
  conditionalUpload([{ name: "images", maxCount: 10 }]),
  validateRequest(ProductValidation.updateProductSchema),
  ProductController.updateProduct
);

router.delete("/:id", ProductController.deleteProduct);

export const ProductRoutes = router;