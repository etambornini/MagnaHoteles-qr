import { NextFunction, Request, Response, RequestHandler } from "express";

export const asyncHandler =
  <TRequest extends Request = Request, TResponse extends Response = Response>(
    handler: (req: TRequest, res: TResponse, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req as TRequest, res as TResponse, next)).catch(next);
  };
