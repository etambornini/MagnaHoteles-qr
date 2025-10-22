import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  listProductsHandler,
  updateProductHandler,
} from "./product.controller";
import {
  createProductBodySchema,
  productDetailQuerySchema,
  productIdParamSchema,
  productListQuerySchema,
  updateProductBodySchema,
} from "./product.schema";

export const productRouter = Router();

productRouter.get("/", validateRequest({ query: productListQuerySchema }), listProductsHandler);

productRouter.post(
  "/",
  validateRequest({
    body: createProductBodySchema,
    query: productDetailQuerySchema,
  }),
  createProductHandler,
);

productRouter.get(
  "/:id",
  validateRequest({
    params: productIdParamSchema,
    query: productDetailQuerySchema,
  }),
  getProductHandler,
);

productRouter.patch(
  "/:id",
  validateRequest({
    params: productIdParamSchema,
    body: updateProductBodySchema,
    query: productDetailQuerySchema,
  }),
  updateProductHandler,
);

productRouter.delete("/:id", validateRequest({ params: productIdParamSchema }), deleteProductHandler);
