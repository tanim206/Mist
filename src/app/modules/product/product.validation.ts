import { z } from "zod";
import { ProductStatus } from "../../../generated/prisma/enums";

const productImageSchema = z.object({
  imageUrl: z.string().url("Image URL must be a valid URL"),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const productVideoSchema = z.object({
  videoUrl: z.string().url("Video URL must be a valid URL"),
  publicId: z.string().optional(),
  thumbnailUrl: z.string().url("Thumbnail URL must be a valid URL").optional(),
  isPrimary: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const productAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required").max(100),
  value: z.string().min(1, "Attribute value is required").max(500),
});

const productVariantOptionSchema = z.object({
  name: z.string().min(1, "Option name is required").max(100),
  value: z.string().min(1, "Option value is required").max(100),
});

const productVariantSchema = z.object({
  sku: z.string().min(1, "Variant SKU is required").max(100),
  price: z.number().min(0, "Price must be >= 0"),
  discountPrice: z.number().min(0, "Discount price must be >= 0").optional(),
  stock: z.number().int().min(0, "Stock must be >= 0"),
  imageUrl: z.string().url("Image URL must be a valid URL").optional(),
  imagePublicId: z.string().optional(),
  options: z.array(productVariantOptionSchema).min(1, "At least one variant option is required"),
}).refine((data) => {
  if (data.discountPrice !== undefined && data.discountPrice > data.price) {
    return false;
  }
  return true;
}, {
  message: "Discount price cannot exceed price",
  path: ["discountPrice"],
});

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().max(200).optional(),
  sku: z.string().min(1, "SKU is required").max(100),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  status: z
    .enum([ProductStatus.DRAFT, ProductStatus.ACTIVE, ProductStatus.INACTIVE, ProductStatus.ARCHIVED])
    .default(ProductStatus.DRAFT),
  images: z.array(productImageSchema).optional(),
  videos: z.array(productVideoSchema).optional(),
  attributes: z.array(productAttributeSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  sku: z.string().max(100).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  status: z.enum([ProductStatus.DRAFT, ProductStatus.ACTIVE, ProductStatus.INACTIVE, ProductStatus.ARCHIVED]).optional(),
  images: z.array(productImageSchema).optional(),
  videos: z.array(productVideoSchema).optional(),
  attributes: z.array(productAttributeSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
});

export const ProductValidation = {
  createProductSchema,
  updateProductSchema,
};