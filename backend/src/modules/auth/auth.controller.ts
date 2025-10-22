import { Request, Response } from "express";
import { asyncHandler } from "../common/asyncHandler";
import { loginUser, registerUser } from "./auth.service";

export const registerUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(user);
});

export const loginUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.json(result);
});
