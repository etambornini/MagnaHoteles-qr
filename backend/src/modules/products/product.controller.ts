import { Request, Response } from "express";
import { asyncHandler } from "../common/asyncHandler";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "./product.service";

const toSingleValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const buildIncludeOptionsFromQuery = (query: Record<string, string | string[] | undefined>) => {
  const includeCategories = toSingleValue(query.includeCategories);
  const includeVariants = toSingleValue(query.includeVariants);
  const includeAttributes = toSingleValue(query.includeAttributes);
  const includeBundles = toSingleValue(query.includeBundles);

  return {
    includeCategories: includeCategories ? includeCategories === "true" : false,
    includeVariants: includeVariants ? includeVariants === "true" : true,
    includeAttributes: includeAttributes ? includeAttributes === "true" : true,
    includeBundles: includeBundles ? includeBundles === "true" : false,
  };
};

const parseCategoryIds = (raw?: string | string[]) => {
  const value = toSingleValue(raw);
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const includeOptions = buildIncludeOptionsFromQuery(req.query as Record<string, string | string[] | undefined>);
  const product = await createProduct(req.hotelId!, req.body, includeOptions);
  res.status(201).json(product);
});

export const listProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string | string[] | undefined>;
  const includeOptions = buildIncludeOptionsFromQuery(query);

  const categoryIds = parseCategoryIds(query.categoryIds);

  const result = await listProducts(
    req.hotelId!,
    {
      search: toSingleValue(query.search) ?? undefined,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      isActive: toSingleValue(query.isActive) ? toSingleValue(query.isActive) === "true" : undefined,
      minPrice: toSingleValue(query.minPrice) ? Number(toSingleValue(query.minPrice)) : undefined,
      maxPrice: toSingleValue(query.maxPrice) ? Number(toSingleValue(query.maxPrice)) : undefined,
      variantOptionId: toSingleValue(query.variantOptionId) ?? undefined,
      attributes: toSingleValue(query.attributes) ?? undefined,
      page: toSingleValue(query.page) ? Number(toSingleValue(query.page)) : undefined,
      pageSize: toSingleValue(query.pageSize) ? Number(toSingleValue(query.pageSize)) : undefined,
    },
    includeOptions,
  );

  res.json(result);
});

export const getProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const includeOptions = buildIncludeOptionsFromQuery(req.query as Record<string, string | string[] | undefined>);
  const { id } = req.params as { id: string };
  const product = await getProductById(req.hotelId!, id, includeOptions);
  res.json(product);
});

export const updateProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const includeOptions = buildIncludeOptionsFromQuery(req.query as Record<string, string | string[] | undefined>);
  const { id } = req.params as { id: string };
  const product = await updateProduct(req.hotelId!, id, req.body, includeOptions);
  res.json(product);
});

export const deleteProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await deleteProduct(req.hotelId!, id);
  res.status(204).send();
});
