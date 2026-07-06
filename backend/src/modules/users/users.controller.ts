import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { CreateUserInput, UpdateUserInput } from "./users.types";

const usersService = new UsersService();

export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await usersService.list();
    res.status(200).json({ data: users });
  } catch (err) {
    next(err);
  }
}

export async function createUser(
  req: Request<unknown, unknown, CreateUserInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, password, full_name, site_id, role_ids, department_ids } = req.body;

    if (!username || !password || !full_name || site_id === undefined) {
      res.status(400).json({
        error_code: "VALIDATION_ERROR",
        message: "יש לספק שם משתמש, סיסמה, שם מלא ואתר",
        field_errors: [
          ...(!username ? [{ field: "username", issue: "required" }] : []),
          ...(!password ? [{ field: "password", issue: "required" }] : []),
          ...(!full_name ? [{ field: "full_name", issue: "required" }] : []),
          ...(site_id === undefined ? [{ field: "site_id", issue: "required" }] : []),
        ],
      });
      return;
    }

    const user = await usersService.create({ username, password, full_name, site_id, role_ids, department_ids });
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: Request<{ id: string }, unknown, UpdateUserInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await usersService.update(id, req.body);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await usersService.deactivate(id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function activateUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await usersService.activate(id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}
