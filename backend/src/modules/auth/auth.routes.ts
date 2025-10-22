import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { loginSchema, registerSchema } from "./auth.schema";
import { loginUserHandler, registerUserHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest({ body: registerSchema.shape.body }),
  registerUserHandler,
);

authRouter.post("/login", validateRequest({ body: loginSchema.shape.body }), loginUserHandler);
