import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;

  res.status(statusCode).json({
    error_code: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
    message: err.message || "אירעה שגיאה בלתי צפויה",
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error_code: "NOT_FOUND",
    message: `הנתיב ${req.originalUrl} לא נמצא`,
  });
}
