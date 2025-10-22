import type { Category, Product } from "@/features/catalog/types";
import type { Hotel } from "@/features/hotels/types";
import type { PaginatedResponse } from "@/lib/types";
import { apiFetch } from "@/lib/http";

const hotelHeader = (hotelSlugOrId?: string | null): Record<string, string> =>
  hotelSlugOrId ? { "x-hotel-id": hotelSlugOrId } : {};

export const adminListCategories = (
  token: string,
  hotelSlugOrId: string | null,
  params: { search?: string } = {},
) =>
  apiFetch<PaginatedResponse<Category>>("/admin/categories", {
    token,
    headers: hotelHeader(hotelSlugOrId),
    query: {
      search: params.search,
      includeAttributes: true,
      includeChildren: true,
      pageSize: 100,
    },
  });

export const adminCreateCategory = (
  token: string,
  hotelSlugOrId: string | null,
  payload: {
    name: string;
    key: string;
    description?: string;
    unitOfMeasure?: string;
    parentId?: string | null;
  },
) =>
  apiFetch<Category>("/admin/categories", {
    method: "POST",
    token,
    headers: hotelHeader(hotelSlugOrId),
    body: payload,
  });

export const adminUpdateCategory = (
  token: string,
  hotelSlugOrId: string | null,
  categoryId: string,
  payload: {
    name?: string;
    key?: string;
    description?: string | null;
    unitOfMeasure?: string | null;
  },
) =>
  apiFetch<Category>(`/admin/categories/${categoryId}`, {
    method: "PATCH",
    token,
    headers: hotelHeader(hotelSlugOrId),
    body: payload,
  });

export const adminDeleteCategory = (token: string, hotelSlugOrId: string | null, categoryId: string) =>
  apiFetch<void>(`/admin/categories/${categoryId}`, {
    method: "DELETE",
    token,
    headers: hotelHeader(hotelSlugOrId),
  });

export const adminListProducts = (
  token: string,
  hotelSlugOrId: string | null,
  params: { search?: string; categoryIds?: string[] } = {},
) =>
  apiFetch<PaginatedResponse<Product>>("/admin/products", {
    token,
    headers: hotelHeader(hotelSlugOrId),
    query: {
      search: params.search,
      categoryIds: params.categoryIds?.join(","),
      includeCategories: true,
      includeAttributes: false,
      includeVariants: false,
      pageSize: 100,
    },
  });

export const adminCreateProduct = (
  token: string,
  hotelSlugOrId: string | null,
  payload: {
    name: string;
    slug: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryIds?: string[];
    images?: string[];
    isActive?: boolean;
  },
) =>
  apiFetch<Product>("/admin/products", {
    method: "POST",
    token,
    headers: hotelHeader(hotelSlugOrId),
    body: payload,
  });

export const adminUpdateProduct = (
  token: string,
  hotelSlugOrId: string | null,
  productId: string,
  payload: Partial<{
    name: string;
    slug: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryIds?: string[];
    images?: string[];
    isActive?: boolean;
  }>,
) =>
  apiFetch<Product>(`/admin/products/${productId}`, {
    method: "PATCH",
    token,
    headers: hotelHeader(hotelSlugOrId),
    body: payload,
  });

export const adminDeleteProduct = (token: string, hotelSlugOrId: string | null, productId: string) =>
  apiFetch<void>(`/admin/products/${productId}`, {
    method: "DELETE",
    token,
    headers: hotelHeader(hotelSlugOrId),
  });

export const adminListHotels = (token: string) =>
  apiFetch<PaginatedResponse<Hotel>>("/admin/hotels", {
    token,
    query: {
      pageSize: 100,
    },
  });

export const adminUpdateHotel = (
  token: string,
  hotelId: string,
  payload: Partial<{
    name: string;
    slug: string;
    description: string | null;
    timeZone: string | null;
    imgQr: string | null;
    metadata: Hotel["metadata"];
  }>,
) =>
  apiFetch<Hotel>(`/admin/hotels/${hotelId}`, {
    method: "PATCH",
    token,
    body: payload,
  });

export type UploadImageResponse = {
  url: string;
  relativePath: string;
  format: string;
  size: number;
};

export const adminUploadImage = (
  token: string,
  hotelSlugOrId: string | null,
  payload: {
    type: "qr" | "category" | "product";
    file: File;
    categoryKey?: string;
    productSlug?: string;
  },
) => {
  const formData = new FormData();
  formData.append("type", payload.type);
  if (payload.categoryKey) {
    formData.append("categoryKey", payload.categoryKey);
  }
  if (payload.productSlug) {
    formData.append("productSlug", payload.productSlug);
  }
  formData.append("file", payload.file);

  return apiFetch<UploadImageResponse>("/admin/uploads/images", {
    method: "POST",
    token,
    headers: hotelHeader(hotelSlugOrId),
    body: formData,
  });
};
