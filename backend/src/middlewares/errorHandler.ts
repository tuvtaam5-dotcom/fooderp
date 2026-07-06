import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  errorCode?: string;
  fieldErrors?: Array<{ field: string; issue: string }>;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const errorCode =
    err.errorCode ?? (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR");

  res.status(statusCode).json({
    error_code: errorCode,
    message: err.message || "אירעה שגיאה בלתי צפויה",
    ...(err.fieldErrors ? { field_errors: err.fieldErrors } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error_code: "NOT_FOUND",
    message: `הנתיב ${req.originalUrl} לא נמצא`,
  });
}
