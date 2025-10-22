import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { AppError } from "../modules/common/errors";

// Centralized error handler to provide consistent responses
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(422).json({
      message: "Validation failed",
      issues: err.issues,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      message: err.message,
      code: err.code,
    });
  }

  console.error("Unexpected error", err);

  return res.status(500).json({
    message: "Unexpected server error",
  });
};
