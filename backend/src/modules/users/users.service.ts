import { prisma } from "../../shared/prisma";
import { hashPassword } from "../../shared/password";
import { CreateUserInput, UpdateUserInput, UserResponse } from "./users.types";

/**
 * UsersService - Sprint 25 implementation, backed by Prisma/PostgreSQL.
 *
 * Business rules enforced here (Business Specification §25.5-25.6, and the
 * department-required correction applied during the Create User step):
 * - Users are never physically deleted, only deactivated (status=inactive).
 * - Every user must have at least one role (role_ids min length 1).
 * - Every user must have at least one department (department_ids min
 *   length 1) — department determines which modules/screens a user can
 *   see; role determines which actions they can perform.
 * - Roles and Departments are independent many-to-many relationships,
 *   never merged into a single field.
 * - Activating/deactivating a user requires a non-empty reason. NOTE: the
 *   reason is currently persisted only as the user's latest
 *   status_change_reason (single value, overwritten each time) — this is
 *   NOT a full Audit Trail (no history, no actor, no timestamp log yet).
 *   That is explicitly a separate, later Sprint 25 step ("Audit Trail for
 *   user changes") and has not been built here.
 */
export class UsersService {
  public async list(): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({
      include: { roles: true, departments: true },
      orderBy: { id: "asc" },
    });
    return users.map(toUserResponse);
  }

  public async create(input: CreateUserInput): Promise<UserResponse> {
    if (!input.role_ids || input.role_ids.length === 0) {
      throw new BusinessRuleError("role_ids", "min_length_1", "יש לשייך לפחות תפקיד אחד למשתמש");
    }
    if (!input.department_ids || input.department_ids.length === 0) {
      throw new BusinessRuleError("department_ids", "min_length_1", "יש לשייך לפחות מחלקה אחת למשתמש");
    }

    const existing = await prisma.user.findUnique({ where: { username: input.username } });
    if (existing) {
      throw new ConflictError("username", "already_exists", "שם משתמש כבר קיים במערכת");
    }

    const created = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash: hashPassword(input.password),
        fullName: input.full_name,
        siteId: input.site_id,
        status: "active",
        roles: { create: input.role_ids.map((roleId) => ({ roleId })) },
        departments: { create: input.department_ids.map((departmentId) => ({ departmentId })) },
      },
      include: { roles: true, departments: true },
    });

    return toUserResponse(created);
  }

  public async update(id: number, input: UpdateUserInput): Promise<UserResponse> {
    await this.findOrThrow(id);

    if (input.role_ids !== undefined && input.role_ids.length === 0) {
      throw new BusinessRuleError("role_ids", "min_length_1", "יש לשייך לפחות תפקיד אחד למשתמש");
    }
    if (input.department_ids !== undefined && input.department_ids.length === 0) {
      throw new BusinessRuleError("department_ids", "min_length_1", "יש לשייך לפחות מחלקה אחת למשתמש");
    }

    // Prisma's explicit join-table models (UserRole/UserDepartment) require
    // manual replace-all semantics inside a transaction — there is no
    // implicit "set roleIds: [...]" shorthand like Prisma offers for
    // implicit M:N relations.
    const updated = await prisma.$transaction(async (tx) => {
      if (input.role_ids !== undefined) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: input.role_ids.map((roleId) => ({ userId: id, roleId })),
        });
      }

      if (input.department_ids !== undefined) {
        await tx.userDepartment.deleteMany({ where: { userId: id } });
        await tx.userDepartment.createMany({
          data: input.department_ids.map((departmentId) => ({ userId: id, departmentId })),
        });
      }

      return tx.user.update({
        where: { id },
        data: {
          username: input.username,
          fullName: input.full_name,
          siteId: input.site_id,
        },
        include: { roles: true, departments: true },
      });
    });

    return toUserResponse(updated);
  }

  public async deactivate(id: number, reason: string): Promise<UserResponse> {
    await this.findOrThrow(id);
    if (!reason || reason.trim().length === 0) {
      throw new BusinessRuleError("reason", "required", "יש לספק סיבה לפני השבתת משתמש");
    }
    // Raw SQL used deliberately for this one statement: on at least one
    // real-world machine, prisma.user.update({ data: { statusChangeReason }})
    // threw "Unknown argument: statusChangeReason" even after a confirmed
    // successful migration + `prisma generate` + full server restart. The
    // schema and the typed call were verified correct multiple times and
    // could not explain that error. $executeRaw bypasses the generated
    // client's DMMF-based argument validation entirely, so it works
    // regardless of whatever caused that mismatch locally.
    await prisma.$executeRaw`UPDATE "users" SET "status" = 'inactive', "status_change_reason" = ${reason} WHERE "id" = ${id}`;
    const updated = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: { roles: true, departments: true },
    });
    return toUserResponse(updated);
  }

  public async activate(id: number, reason: string): Promise<UserResponse> {
    await this.findOrThrow(id);
    if (!reason || reason.trim().length === 0) {
      throw new BusinessRuleError("reason", "required", "יש לספק סיבה לפני הפעלת משתמש");
    }
    await prisma.$executeRaw`UPDATE "users" SET "status" = 'active', "status_change_reason" = ${reason} WHERE "id" = ${id}`;
    const updated = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: { roles: true, departments: true },
    });
    return toUserResponse(updated);
  }

  private async findOrThrow(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError(`משתמש עם מזהה ${id} לא נמצא`);
    }
    return user;
  }
}

// Prisma's generated User type (with roles/departments included) is
// structurally what this function expects; typed loosely here to avoid a
// hard compile-time dependency on the generated @prisma/client shape in
// this file's signature.
function toUserResponse(user: any): UserResponse {
  return {
    user_id: user.id,
    username: user.username,
    full_name: user.fullName,
    status: user.status,
    status_change_reason: user.statusChangeReason ?? null,
    site_id: user.siteId,
    role_ids: user.roles.map((r: { roleId: number }) => r.roleId),
    department_ids: user.departments.map((d: { departmentId: number }) => d.departmentId),
  };
}

export class BusinessRuleError extends Error {
  public statusCode = 422;
  public errorCode = "BUSINESS_RULE_VIOLATION";
  public fieldErrors: Array<{ field: string; issue: string }>;
  constructor(field: string, issue: string, message: string) {
    super(message);
    this.fieldErrors = [{ field, issue }];
  }
}

export class ConflictError extends Error {
  public statusCode = 409;
  public errorCode = "CONFLICT";
  public fieldErrors: Array<{ field: string; issue: string }>;
  constructor(field: string, issue: string, message: string) {
    super(message);
    this.fieldErrors = [{ field, issue }];
  }
}

export class NotFoundError extends Error {
  public statusCode = 404;
  public errorCode = "NOT_FOUND";
}
