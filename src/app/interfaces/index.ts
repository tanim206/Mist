import { ICategoryQuery } from "../modules/category/category.interface"

export interface IQuery {
    searchTerm?: string
    page?: string
    limit?: string
    sortOrder?: string
    sortBy?: string

    //any other filter fields can be added here
    [key: string] : any
}



export const buildWhereClause = (query: ICategoryQuery) => {
  const { searchTerm, status, ...filters } = query;

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { slug: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!["page", "limit", "sortBy", "sortOrder", "searchTerm"].includes(key)) {
      where[key] = value;
    }
  });

  return where;
};
