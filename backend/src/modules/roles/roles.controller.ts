import { Request, Response, NextFunction } from "express";
import { prisma } from "../../shared/prisma";

export async function listRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await prisma.role.findMany({ orderBy: { id: "asc" } });
    res.status(200).json({
      data: roles.map((r) => ({ role_id: r.id, role_name: r.name })),
    });
  } catch (err) {
    next(err);
  }
}
