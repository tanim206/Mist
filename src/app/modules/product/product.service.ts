import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  IProductCreate,
  IProductQuery,
  IProductResponse,
  IProductUpdate,
} from "./product.interface";
import { uploadToCloudinary } from "../../middleware/uploadCloudinary";
import { cloudinary } from "../../lib/cloudinary";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const buildProductWhereClause = (query: IProductQuery) => {
  const { searchTerm, status, categoryId, ...filters } = query;

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { slug: { contains: searchTerm, mode: "insensitive" } },
      { sku: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!["page", "limit", "sortBy", "sortOrder", "searchTerm"].includes(key)) {
      where[key] = value;
    }
  });

  return where;
};

const createProduct = async (
  payload: IProductCreate,
  imageBuffers?: Buffer[],
) => {
  const slug = payload.slug || generateSlug(payload.name);

  const existingProduct = await prisma.products.findFirst({
    where: {
      OR: [{ name: payload.name }, { slug }, { sku: payload.sku }],
      deletedAt: null,
    },
  });

  if (existingProduct) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Product with this name, slug, or SKU already exists",
    );
  }

  const category = await prisma.category.findUnique({
    where: { categoryId: payload.categoryId },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.products.create({
      data: {
        ...payload,
        slug,
        images: payload.images?.length
          ? {
              create: payload.images.map((img, index) => ({
                imageUrl: img.imageUrl,
                publicId: img.publicId,
                isPrimary: img.isPrimary ?? index === 0,
                sortOrder: img.sortOrder ?? index,
              })),
            }
          : undefined,
        videos: payload.videos?.length
          ? {
              create: payload.videos.map((vid, index) => ({
                videoUrl: vid.videoUrl,
                publicId: vid.publicId,
                thumbnailUrl: vid.thumbnailUrl,
                isPrimary: vid.isPrimary ?? index === 0,
                sortOrder: vid.sortOrder ?? index,
              })),
            }
          : undefined,
        attributes: payload.attributes?.length
          ? {
              create: payload.attributes.map((attr) => ({
                name: attr.name,
                value: attr.value,
              })),
            }
          : undefined,
        variants: payload.variants?.length
          ? {
              create: payload.variants.map((variant) => ({
                sku: variant.sku,
                price: variant.price,
                discountPrice: variant.discountPrice,
                stock: variant.stock,
                imageUrl: variant.imageUrl,
                imagePublicId: variant.imagePublicId,
                options: {
                  create: variant.options.map((opt) => ({
                    name: opt.name,
                    value: opt.value,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        variants: {
          include: { options: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return product;
  });

  return result;
};

const getAllProducts = async (query: IProductQuery) => {
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filterQuery
  } = query;

  const where = buildProductWhereClause(filterQuery);
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        variants: {
          include: { options: true },
          orderBy: { createdAt: "asc" },
        },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.products.count({ where }),
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: products,
    meta: {
      page: Number(page),
      limit: take,
      total,
      totalPages,
    },
  };
};

const getProductById = async (id: string) => {
  const product = await prisma.products.findFirst({
    where: { productId: id, deletedAt: null },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      attributes: true,
      variants: {
        include: { options: true },
        orderBy: { createdAt: "asc" },
      },
      category: { select: { name: true, slug: true } },
    },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  return product;
};

const getProductBySlug = async (slug: string) => {
  const product = await prisma.products.findFirst({
    where: { slug, deletedAt: null },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      attributes: true,
      variants: {
        include: { options: true },
        orderBy: { createdAt: "asc" },
      },
      category: { select: { name: true, slug: true } },
    },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  return product;
};

const updateProduct = async (
  id: string,
  payload: IProductUpdate,
  imageBuffers?: Buffer[],
) => {
  const product = await prisma.products.findFirst({
    where: { productId: id, deletedAt: null },
    include: {
      images: true,
      videos: true,
      attributes: true,
      variants: { include: { options: true } },
    },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  const slug = payload.slug || (payload.name ? generateSlug(payload.name) : undefined);

  if (payload.name || slug || payload.sku) {
    const existingProduct = await prisma.products.findFirst({
      where: {
        OR: [{ name: payload.name }, { slug }, { sku: payload.sku }],
        NOT: { productId: id },
        deletedAt: null,
      },
    });

    if (existingProduct) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Product with this name, slug, or SKU already exists",
      );
    }
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { categoryId: payload.categoryId },
    });
    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    if (payload.images !== undefined) {
      for (const img of product.images) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId).catch(() => {});
        }
      }
      await tx.productImage.deleteMany({ where: { productId: id } });
    }

    if (payload.videos !== undefined) {
      for (const vid of product.videos) {
        if (vid.publicId) {
          await cloudinary.uploader.destroy(vid.publicId).catch(() => {});
        }
      }
      await tx.productVideo.deleteMany({ where: { productId: id } });
    }

    if (payload.attributes !== undefined) {
      await tx.productAttribute.deleteMany({ where: { productId: id } });
    }

    if (payload.variants !== undefined) {
      for (const variant of product.variants) {
        if (variant.imagePublicId) {
          await cloudinary.uploader.destroy(variant.imagePublicId).catch(() => {});
        }
      }
      await tx.productVariantOption.deleteMany({
        where: { variant: { productId: id } },
      });
      await tx.productVariant.deleteMany({ where: { productId: id } });
    }

    const updatedProduct = await tx.products.update({
      where: { productId: id },
      data: {
        ...payload,
        ...(slug && { slug }),
        images: payload.images?.length
          ? {
              create: payload.images.map((img, index) => ({
                imageUrl: img.imageUrl,
                publicId: img.publicId,
                isPrimary: img.isPrimary ?? index === 0,
                sortOrder: img.sortOrder ?? index,
              })),
            }
          : undefined,
        videos: payload.videos?.length
          ? {
              create: payload.videos.map((vid, index) => ({
                videoUrl: vid.videoUrl,
                publicId: vid.publicId,
                thumbnailUrl: vid.thumbnailUrl,
                isPrimary: vid.isPrimary ?? index === 0,
                sortOrder: vid.sortOrder ?? index,
              })),
            }
          : undefined,
        attributes: payload.attributes?.length
          ? {
              create: payload.attributes.map((attr) => ({
                name: attr.name,
                value: attr.value,
              })),
            }
          : undefined,
        variants: payload.variants?.length
          ? {
              create: payload.variants.map((variant) => ({
                sku: variant.sku,
                price: variant.price,
                discountPrice: variant.discountPrice,
                stock: variant.stock,
                imageUrl: variant.imageUrl,
                imagePublicId: variant.imagePublicId,
                options: {
                  create: variant.options.map((opt) => ({
                    name: opt.name,
                    value: opt.value,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        variants: {
          include: { options: true },
          orderBy: { createdAt: "asc" },
        },
        category: { select: { name: true, slug: true } },
      },
    });

    return updatedProduct;
  });

  return result;
};

const deleteProduct = async (id: string) => {
  const product = await prisma.products.findFirst({
    where: { productId: id, deletedAt: null },
    include: {
      images: true,
      videos: true,
      variants: true,
    },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  await prisma.$transaction(async (tx) => {
    for (const img of product.images) {
      if (img.publicId) {
        await cloudinary.uploader.destroy(img.publicId).catch(() => {});
      }
    }
    for (const vid of product.videos) {
      if (vid.publicId) {
        await cloudinary.uploader.destroy(vid.publicId).catch(() => {});
      }
    }
    for (const variant of product.variants) {
      if (variant.imagePublicId) {
        await cloudinary.uploader.destroy(variant.imagePublicId).catch(() => {});
      }
    }

    await tx.products.update({
      where: { productId: id },
      data: { deletedAt: new Date() },
    });
  });

  return { message: "Product deleted successfully" };
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};