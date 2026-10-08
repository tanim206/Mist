import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  ICategoryCreate,
  ICategoryQuery,
  ICategoryResponse,
  ICategoryUpdate,
} from "./category.interface";
import { cloudinary } from "../../lib/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { buildWhereClause } from "../../interfaces";
import { uploadToCloudinary } from "../../middleware/uploadCloudinary";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};



const createCategory = async (
  payload: ICategoryCreate,
  imageBuffer?: Buffer,
) => {
  const slug = payload.slug || generateSlug(payload.name);

  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [{ name: payload.name }, { slug }],
      deletedAt: null,
    },
  });

  if (existingCategory) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Category with this name or slug already exists",
    );
  }

  let imageUrl = "";
  let imagePublicId = "";

  if (imageBuffer) {
    const result = await uploadToCloudinary(imageBuffer);
    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const category = await prisma.category.create({
    data: {
      ...payload,
      slug,
      category_image: imageUrl || (payload.category_image ?? ""),
      category_imagePublic_Id:
        imagePublicId || (payload.category_imagePublic_Id ?? ""),
    },
  });

  return category;
};

const getAllCategories = async (query: ICategoryQuery) => {
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filterQuery
  } = query;

  const where = buildWhereClause(filterQuery);
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.category.count({ where }),
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: categories,
    meta: {
      page: Number(page),
      limit: take,
      total,
      totalPages,
    },
  };
};

const getCategoryById = async (id: string) => {
  const category = await prisma.category.findFirst({
    where: { categoryId: id, deletedAt: null },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findFirst({
    where: { slug, deletedAt: null },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

const updateCategory = async (
  id: string,
  payload: ICategoryUpdate,
  imageBuffer?: Buffer,
) => {
  const category = await prisma.category.findFirst({
    where: { categoryId: id, deletedAt: null },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  const slug =
    payload.slug || (payload.name ? generateSlug(payload.name) : undefined);

  if (payload.name || slug) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: payload.name }, { slug }],
        NOT: { categoryId: id },
        deletedAt: null,
      },
    });

    if (existingCategory) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Category with this name or slug already exists",
      );
    }
  }

  let imageUrl = category.category_image;
  let imagePublicId = category.category_imagePublic_Id;

  if (imageBuffer) {
    if (category.category_imagePublic_Id) {
      await cloudinary.uploader.destroy(category.category_imagePublic_Id);
    }
    const result = await uploadToCloudinary(imageBuffer);
    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const updatedCategory = await prisma.category.update({
    where: { categoryId: id },
    data: {
      ...payload,
      ...(slug && { slug }),
      category_image: imageUrl,
      category_imagePublic_Id: imagePublicId,
    },
  });

  return updatedCategory;
};

const deleteCategory = async (id: string) => {
  const category = await prisma.category.findFirst({
    where: { categoryId: id, deletedAt: null },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  if (category.category_imagePublic_Id) {
    await cloudinary.uploader.destroy(category.category_imagePublic_Id);
  }

  const deletedCategory = await prisma.category.update({
    where: { categoryId: id },
    data: { deletedAt: new Date() },
  });

  return deletedCategory;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};
