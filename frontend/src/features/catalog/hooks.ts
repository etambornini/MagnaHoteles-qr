import { useQuery } from "@tanstack/react-query";
import { listCategoriesForHotel, listProductsForHotel } from "./api";

const catalogQueryKeys = {
  categories: (hotelSlug: string | undefined) => ["catalog", hotelSlug, "categories"] as const,
  products: (hotelSlug: string | undefined, filters: Record<string, unknown>) =>
    ["catalog", hotelSlug, "products", filters] as const,
};

export const useHotelCategories = (hotelSlug: string | undefined) =>
  useQuery({
    queryKey: catalogQueryKeys.categories(hotelSlug),
    queryFn: async () => {
      if (!hotelSlug) {
        throw new Error("Hotel requerido");
      }
      return listCategoriesForHotel(hotelSlug, {
        includeChildren: true,
        includeAttributes: true,
        pageSize: 100,
      });
    },
    enabled: Boolean(hotelSlug),
  });

export const useHotelProducts = (
  hotelSlug: string | undefined,
  filters: {
    search?: string;
    categoryIds?: string[];
  } = {},
) => {
  const normalizedFilters = {
    search: filters.search ?? "",
    categoryIds: filters.categoryIds ? [...filters.categoryIds].sort().join(",") : "",
  };

  return useQuery({
    queryKey: catalogQueryKeys.products(hotelSlug, normalizedFilters),
    queryFn: async () => {
      if (!hotelSlug) {
        throw new Error("Hotel requerido");
      }
      return listProductsForHotel(hotelSlug, {
        search: filters.search,
        categoryIds: filters.categoryIds,
        includeCategories: true,
        includeVariants: false,
        includeAttributes: false,
        pageSize: 200,
      });
    },
    enabled: Boolean(hotelSlug),
  });
};
