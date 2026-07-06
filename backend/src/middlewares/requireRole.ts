import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./requireAuth";
import { prisma } from "../shared/prisma";

/**
 * RBAC middleware factory. Resolves the required role NAME to its DB id
 * once (cached in-memory — roles are fixed reference data per Business
 * Spec ch25.1, not expected to change at runtime), then checks the
 * authenticated caller's roleIds against it on every request.
 *
 * Per RBAC Matrix §2.15: the Users/Roles/Departments module has exactly
 * ONE authorized role (מנהל מערכת) — this middleware is intentionally
 * single-role for this sprint's scope, not a general multi-role checker,
 * though it could be extended to accept multiple allowed role names later.
 */

const roleIdCache = new Map<string, number>();

async function resolveRoleId(roleName: string): Promise<number> {
  if (roleIdCache.has(roleName)) {
    return roleIdCache.get(roleName) as number;
  }
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  roleIdCache.set(roleName, role.id);
  return role.id;
}

export function requireRole(roleName: string) {
  return async function (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.auth) {
      // Should not happen if requireAuth runs first, but fail safe.
      res.status(401).json({
        error_code: "UNAUTHORIZED",
        message: "נדרש טוקן הזדהות",
      });
      return;
    }

    try {
      const requiredRoleId = await resolveRoleId(roleName);

      if (!req.auth.roleIds.includes(requiredRoleId)) {
        res.status(403).json({
          error_code: "FORBIDDEN",
          message: "אין הרשאה לגשת למודול משתמשים והרשאות",
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
