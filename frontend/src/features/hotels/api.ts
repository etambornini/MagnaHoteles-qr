import { apiFetch } from "@/lib/http";
import type { PaginatedResponse } from "@/lib/types";
import type { Hotel } from "./types";

export type ListHotelsParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export const listHotels = async (params: ListHotelsParams = {}): Promise<PaginatedResponse<Hotel>> =>
  apiFetch<PaginatedResponse<Hotel>>("/hotels", {
    query: {
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    },
  });

export const getHotelBySlug = async (slug: string): Promise<Hotel> => {
  const result = await listHotels({ search: slug, pageSize: 10 });
  const hotel = result.items.find((item) => item.slug === slug);
  if (!hotel) {
    throw new Error("Hotel no encontrado");
  }
  return hotel;
};
