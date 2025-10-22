import { ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

type ValidationSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        const parsedParams = schema.params.parse(req.params);
        Object.assign(req.params, parsedParams);
      }
      if (schema.query) {
        const parsedQuery = schema.query.parse(req.query);
        Object.assign(req.query as Record<string, unknown>, parsedQuery);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
};
