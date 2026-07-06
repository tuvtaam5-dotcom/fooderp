import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { LoginRequestBody } from "./auth.types";

const authService = new AuthService();

export async function login(
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error_code: "VALIDATION_ERROR",
        message: "יש לספק שם משתמש וסיסמה",
        field_errors: [
          ...(!username ? [{ field: "username", issue: "required" }] : []),
          ...(!password ? [{ field: "password", issue: "required" }] : []),
        ],
      });
      return;
    }

    const result = await authService.login({ username, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
