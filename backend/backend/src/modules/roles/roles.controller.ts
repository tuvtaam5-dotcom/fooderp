import { Request, Response } from "express";
import { ROLES } from "./roles.data";

export function listRoles(_req: Request, res: Response): void {
  res.status(200).json({ data: ROLES });
}
