import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../shared/jwt";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    roleIds: number[];
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error_code: "UNAUTHORIZED",
      message: "נדרש טוקן הזדהות",
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      error_code: "UNAUTHORIZED",
      message: "טוקן לא תקף או שפג תוקפו",
    });
    return;
  }

  req.auth = { userId: payload.userId, roleIds: payload.roleIds };
  next();
}
