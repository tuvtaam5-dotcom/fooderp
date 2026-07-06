import { Request, Response, NextFunction } from "express";
import { prisma } from "../../shared/prisma";

export async function listDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const departments = await prisma.department.findMany({ orderBy: { id: "asc" } });
    res.status(200).json({
      data: departments.map((d) => ({ department_id: d.id, department_name: d.name })),
    });
  } catch (err) {
    next(err);
  }
}
