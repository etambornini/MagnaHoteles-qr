import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/authenticateAdmin";
import { UserRole } from "../../generated/prisma";
import {
  createHotelHandler,
  deleteHotelHandler,
  getHotelHandler,
  listHotelsHandler,
  updateHotelHandler,
} from "./hotel.controller";
import { createHotelBodySchema, hotelIdParamSchema, hotelListQuerySchema, updateHotelBodySchema } from "./hotel.schema";

export const hotelRouter = Router();

hotelRouter.get("/", validateRequest({ query: hotelListQuerySchema }), listHotelsHandler);
hotelRouter.post(
  "/",
  authenticateUser,
  authorizeRoles(UserRole.ADMIN),
  validateRequest({ body: createHotelBodySchema }),
  createHotelHandler,
);
hotelRouter.get("/:id", validateRequest({ params: hotelIdParamSchema }), getHotelHandler);
hotelRouter.patch(
  "/:id",
  authenticateUser,
  authorizeRoles(UserRole.ADMIN),
  validateRequest({ params: hotelIdParamSchema, body: updateHotelBodySchema }),
  updateHotelHandler,
);
hotelRouter.delete(
  "/:id",
  authenticateUser,
  authorizeRoles(UserRole.ADMIN),
  validateRequest({ params: hotelIdParamSchema }),
  deleteHotelHandler,
);
