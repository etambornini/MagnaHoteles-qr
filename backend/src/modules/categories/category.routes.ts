import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createAttributeOptionHandler,
  createCategoryAttributeHandler,
  createCategoryHandler,
  deleteAttributeOptionHandler,
  deleteCategoryAttributeHandler,
  deleteCategoryHandler,
  getCategoryHandler,
  listCategoriesHandler,
  updateAttributeOptionHandler,
  updateCategoryAttributeHandler,
  updateCategoryHandler,
} from "./category.controller";
import {
  categoryAttributeIdParamSchema,
  categoryAttributeOptionIdParamSchema,
  categoryDetailQuerySchema,
  categoryIdParamSchema,
  categoryListQuerySchema,
  createAttributeOptionBodySchema,
  createCategoryAttributeBodySchema,
  createCategoryBodySchema,
  updateAttributeOptionBodySchema,
  updateCategoryAttributeBodySchema,
  updateCategoryBodySchema,
} from "./category.schema";

export const categoryRouter = Router();

categoryRouter.get("/", validateRequest({ query: categoryListQuerySchema }), listCategoriesHandler);
categoryRouter.post("/", validateRequest({ body: createCategoryBodySchema }), createCategoryHandler);

categoryRouter.get(
  "/:id",
  validateRequest({
    params: categoryIdParamSchema,
    query: categoryDetailQuerySchema,
  }),
  getCategoryHandler,
);

categoryRouter.patch(
  "/:id",
  validateRequest({
    params: categoryIdParamSchema,
    body: updateCategoryBodySchema,
  }),
  updateCategoryHandler,
);

categoryRouter.delete(
  "/:id",
  validateRequest({
    params: categoryIdParamSchema,
  }),
  deleteCategoryHandler,
);

categoryRouter.post(
  "/:id/attributes",
  validateRequest({
    params: categoryIdParamSchema,
    body: createCategoryAttributeBodySchema,
  }),
  createCategoryAttributeHandler,
);

categoryRouter.patch(
  "/:id/attributes/:attributeId",
  validateRequest({
    params: categoryIdParamSchema.merge(categoryAttributeIdParamSchema),
    body: updateCategoryAttributeBodySchema,
  }),
  updateCategoryAttributeHandler,
);

categoryRouter.delete(
  "/:id/attributes/:attributeId",
  validateRequest({
    params: categoryIdParamSchema.merge(categoryAttributeIdParamSchema),
  }),
  deleteCategoryAttributeHandler,
);

categoryRouter.post(
  "/:id/attributes/:attributeId/options",
  validateRequest({
    params: categoryIdParamSchema.merge(categoryAttributeIdParamSchema),
    body: createAttributeOptionBodySchema,
  }),
  createAttributeOptionHandler,
);

categoryRouter.patch(
  "/:id/attributes/:attributeId/options/:optionId",
  validateRequest({
    params: categoryIdParamSchema.merge(categoryAttributeIdParamSchema).merge(categoryAttributeOptionIdParamSchema),
    body: updateAttributeOptionBodySchema,
  }),
  updateAttributeOptionHandler,
);

categoryRouter.delete(
  "/:id/attributes/:attributeId/options/:optionId",
  validateRequest({
    params: categoryIdParamSchema.merge(categoryAttributeIdParamSchema).merge(categoryAttributeOptionIdParamSchema),
  }),
  deleteAttributeOptionHandler,
);
