import { Router } from "express";
import { productRouter } from "../modules/products/product.routes";
import { categoryRouter } from "../modules/categories/category.routes";
import { hotelRouter } from "../modules/hotels/hotel.routes";
import { hotelContext } from "../middleware/hotelContext";
import { authenticateUser, authorizeRoles } from "../middleware/authenticateAdmin";
import { authRouter } from "../modules/auth/auth.routes";
import { validateRequest } from "../middleware/validateRequest";
import {
  categoryListQuerySchema,
  categoryDetailQuerySchema,
  categoryIdParamSchema,
} from "../modules/categories/category.schema";
import { listCategoriesHandler, getCategoryHandler } from "../modules/categories/category.controller";
import {
  productListQuerySchema,
  productDetailQuerySchema,
  productIdParamSchema,
} from "../modules/products/product.schema";
import { listProductsHandler, getProductHandler } from "../modules/products/product.controller";
import { resolveHotelAccess } from "../middleware/resolveHotelAccess";
import { UserRole } from "../generated/prisma";
import { uploadRouter } from "../modules/uploads/upload.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/hotels", hotelRouter);

router.use("/admin/hotels", authenticateUser, authorizeRoles(UserRole.ADMIN), hotelRouter);

router.use(
  "/admin/categories",
  authenticateUser,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  resolveHotelAccess,
  categoryRouter,
);

router.use(
  "/admin/products",
  authenticateUser,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  resolveHotelAccess,
  productRouter,
);

router.use(
  "/admin/uploads",
  authenticateUser,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  resolveHotelAccess,
  uploadRouter,
);

const publicRouter = Router();

publicRouter.get(
  "/categories",
  hotelContext,
  validateRequest({ query: categoryListQuerySchema }),
  listCategoriesHandler,
);

publicRouter.get(
  "/categories/:id",
  hotelContext,
  validateRequest({ params: categoryIdParamSchema, query: categoryDetailQuerySchema }),
  getCategoryHandler,
);

publicRouter.get(
  "/products",
  hotelContext,
  validateRequest({ query: productListQuerySchema }),
  listProductsHandler,
);

publicRouter.get(
  "/products/:id",
  hotelContext,
  validateRequest({ params: productIdParamSchema, query: productDetailQuerySchema }),
  getProductHandler,
);

router.use("/public", publicRouter);
