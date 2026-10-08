import type { ProductStatus } from "../../../generated/prisma/enums";

export interface IProductCreate {
  name: string;
  slug?: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  categoryId: string;
  status?: ProductStatus;
  images?: IProductImageCreate[];
  videos?: IProductVideoCreate[];
  attributes?: IProductAttributeCreate[];
  variants?: IProductVariantCreate[];
}

export interface IProductUpdate {
  name?: string;
  slug?: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  status?: ProductStatus;
  images?: IProductImageCreate[];
  videos?: IProductVideoCreate[];
  attributes?: IProductAttributeCreate[];
  variants?: IProductVariantCreate[];
}

export interface IProductImageCreate {
  imageUrl: string;
  publicId?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface IProductVideoCreate {
  videoUrl: string;
  publicId?: string;
  thumbnailUrl?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface IProductAttributeCreate {
  name: string;
  value: string;
}

export interface IProductVariantCreate {
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  imageUrl?: string;
  imagePublicId?: string;
  options: IProductVariantOptionCreate[];
}

export interface IProductVariantOptionCreate {
  name: string;
  value: string;
}

export interface IProductResponse {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  images: IProductImageResponse[];
  videos: IProductVideoResponse[];
  attributes: IProductAttributeResponse[];
  variants: IProductVariantResponse[];
}

export interface IProductImageResponse {
  imageId: string;
  productId: string;
  imageUrl: string;
  publicId: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVideoResponse {
  videoId: string;
  productId: string;
  videoUrl: string;
  publicId: string | null;
  thumbnailUrl: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductAttributeResponse {
  attributeId: string;
  productId: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariantResponse {
  variantId: string;
  productId: string;
  sku: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  createdAt: Date;
  updatedAt: Date;
  options: IProductVariantOptionResponse[];
}

export interface IProductVariantOptionResponse {
  optionId: string;
  variantId: string;
  name: string;
  value: string;
}

export interface IProductQuery extends Record<string, unknown> {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
  status?: ProductStatus;
  categoryId?: string;
}