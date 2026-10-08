import { z } from "zod";
import { CategoryStatus } from "../../../generated/prisma/enums";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  slug: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  category_image: z.string().url().optional().or(z.literal("")),
  category_imagePublic_Id: z.string().optional(),
  status: z
    .enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE])
    .default(CategoryStatus.ACTIVE),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category_image: z.string().url().optional().or(z.literal("")),
  category_imagePublic_Id: z.string().optional(),
  status: z.enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE]).optional(),
});

export const CategoryValidation = {
  createCategorySchema,
  updateCategorySchema,
};
