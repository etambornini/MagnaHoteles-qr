import { Request, Response } from "express";
import { asyncHandler } from "../common/asyncHandler";
import {
  createAttributeOption,
  createCategory,
  createCategoryAttribute,
  deleteAttributeOption,
  deleteCategory,
  deleteCategoryAttribute,
  getCategoryById,
  listCategories,
  updateAttributeOption,
  updateCategory,
  updateCategoryAttribute,
} from "./category.service";

const toSingleValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export const createCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = await createCategory(req.hotelId!, req.body);
  res.status(201).json(category);
});

export const listCategoriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string | string[] | undefined>;

  const result = await listCategories(req.hotelId!, {
    search: toSingleValue(query.search) ?? undefined,
    parentId: toSingleValue(query.parentId) ?? undefined,
    includeChildren: toSingleValue(query.includeChildren)
      ? toSingleValue(query.includeChildren) === "true"
      : undefined,
    includeAttributes: toSingleValue(query.includeAttributes)
      ? toSingleValue(query.includeAttributes) === "true"
      : undefined,
    page: toSingleValue(query.page) ? Number(toSingleValue(query.page)) : undefined,
    pageSize: toSingleValue(query.pageSize) ? Number(toSingleValue(query.pageSize)) : undefined,
  });

  res.json(result);
});

export const getCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string | string[] | undefined>;
  const { id } = req.params as { id: string };

  const category = await getCategoryById(req.hotelId!, id, {
    includeChildren: toSingleValue(query.includeChildren)
      ? toSingleValue(query.includeChildren) === "true"
      : false,
    includeAttributes: toSingleValue(query.includeAttributes)
      ? toSingleValue(query.includeAttributes) === "true"
      : true,
  });

  res.json(category);
});

export const updateCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const category = await updateCategory(req.hotelId!, id, req.body);
  res.json(category);
});

export const deleteCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await deleteCategory(req.hotelId!, id);
  res.status(204).send();
});

export const createCategoryAttributeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const attribute = await createCategoryAttribute(req.hotelId!, id, req.body);
  res.status(201).json(attribute);
});

export const updateCategoryAttributeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId } = req.params as { id: string; attributeId: string };
  const attribute = await updateCategoryAttribute(req.hotelId!, id, attributeId, req.body);
  res.json(attribute);
});

export const deleteCategoryAttributeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId } = req.params as { id: string; attributeId: string };
  await deleteCategoryAttribute(req.hotelId!, id, attributeId);
  res.status(204).send();
});

export const createAttributeOptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId } = req.params as { id: string; attributeId: string };
  const option = await createAttributeOption(
    req.hotelId!,
    id,
    attributeId,
    req.body,
  );
  res.status(201).json(option);
});

export const updateAttributeOptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId, optionId } = req.params as { id: string; attributeId: string; optionId: string };
  const option = await updateAttributeOption(
    req.hotelId!,
    id,
    attributeId,
    optionId,
    req.body,
  );
  res.json(option);
});

export const deleteAttributeOptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, attributeId, optionId } = req.params as { id: string; attributeId: string; optionId: string };
  await deleteAttributeOption(req.hotelId!, id, attributeId, optionId);
  res.status(204).send();
});
