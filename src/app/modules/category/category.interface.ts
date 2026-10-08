import type { CategoryStatus } from "../../../generated/prisma/enums";

export interface ICategoryCreate {
  name: string;
  slug: string;
  description?: string;
  category_image?: string;
  category_imagePublic_Id?: string;
  status?: CategoryStatus;
}

export interface ICategoryUpdate {
  name?: string;
  slug?: string;
  description?: string;
  category_image?: string;
  category_imagePublic_Id?: string;
  status?: CategoryStatus;
}

export interface ICategoryResponse {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  category_image: string | null;
  category_imagePublic_Id: string | null;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ICategoryQuery extends Record<string, unknown> {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
  status?: CategoryStatus;
}