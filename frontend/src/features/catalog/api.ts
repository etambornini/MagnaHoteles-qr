import { apiFetch } from "@/lib/http";
import type { PaginatedResponse } from "@/lib/types";
import type { Category, Product } from "./types";

const withHotelHeader = (hotelSlugOrId: string) => ({
  "x-hotel-id": hotelSlugOrId,
});

export const listCategoriesForHotel = async (
  hotelSlugOrId: string,
  params: { includeChildren?: boolean; includeAttributes?: boolean; pageSize?: number } = {},
): Promise<PaginatedResponse<Category>> =>
  apiFetch<PaginatedResponse<Category>>("/public/categories", {
    headers: withHotelHeader(hotelSlugOrId),
    query: {
      includeChildren: params.includeChildren,
      includeAttributes: params.includeAttributes,
      pageSize: params.pageSize,
    },
  });

export const listProductsForHotel = async (
  hotelSlugOrId: string,
  params: {
    search?: string;
    categoryIds?: string[];
    includeCategories?: boolean;
    includeVariants?: boolean;
    includeAttributes?: boolean;
    pageSize?: number;
  } = {},
): Promise<PaginatedResponse<Product>> =>
  apiFetch<PaginatedResponse<Product>>("/public/products", {
    headers: withHotelHeader(hotelSlugOrId),
    query: {
      search: params.search,
      categoryIds: params.categoryIds?.join(","),
      includeCategories: params.includeCategories,
      includeVariants: params.includeVariants,
      includeAttributes: params.includeAttributes,
      pageSize: params.pageSize,
    },
  });
