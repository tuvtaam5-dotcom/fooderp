import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { CreateUserInput, UpdateUserInput } from "./users.types";

const usersService = new UsersService();

export function listUsers(_req: Request, res: Response): void {
  res.status(200).json({ data: usersService.list() });
}

export function createUser(
  req: Request<unknown, unknown, CreateUserInput>,
  res: Response,
  next: NextFunction
): void {
  try {
    const { username, fullName, roleIds, siteId } = req.body;

    if (!username || !fullName || siteId === undefined) {
      res.status(400).json({
        error_code: "VALIDATION_ERROR",
        message: "יש לספק שם משתמש, שם מלא ואתר (site)",
      });
      return;
    }

    const user = usersService.create({ username, fullName, roleIds, siteId });
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export function updateUser(
  req: Request<{ id: string }, unknown, UpdateUserInput>,
  res: Response,
  next: NextFunction
): void {
  try {
    const id = Number(req.params.id);
    const user = usersService.update(id, req.body);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export function deactivateUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): void {
  try {
    const id = Number(req.params.id);
    const user = usersService.deactivate(id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export function activateUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): void {
  try {
    const id = Number(req.params.id);
    const user = usersService.activate(id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}
