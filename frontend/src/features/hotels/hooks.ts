import { useQuery } from "@tanstack/react-query";
import { getHotelBySlug, listHotels, type ListHotelsParams } from "./api";

export const hotelsQueryKeys = {
  all: ["hotels"] as const,
  list: (params?: ListHotelsParams) => [...hotelsQueryKeys.all, { params }] as const,
  detail: (slug: string) => [...hotelsQueryKeys.all, "detail", slug] as const,
};

export const useHotels = (params: ListHotelsParams = {}) =>
  useQuery({
    queryKey: hotelsQueryKeys.list(params),
    queryFn: () => listHotels(params),
  });

export const useHotelBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: slug ? hotelsQueryKeys.detail(slug) : ["hotels", "detail", "empty"],
    queryFn: async () => {
      if (!slug) {
        throw new Error("Slug requerido");
      }
      return getHotelBySlug(slug);
    },
    enabled: Boolean(slug),
  });
