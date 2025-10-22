export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown> | unknown[];

  constructor(message: string, statusCode = 400, details?: Record<string, unknown> | unknown[]) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
