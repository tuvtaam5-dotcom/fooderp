import { prisma } from "../../shared/prisma";
import { hashPassword } from "../../shared/password";
import { CreateUserInput, UpdateUserInput, UserResponse } from "./users.types";

/**
 * UsersService - Sprint 25 implementation, backed by Prisma/PostgreSQL.
 *
 * Business rules enforced here (Business Specification §25.5-25.6):
 * - Users are never physically deleted, only deactivated (status=inactive).
 * - Every user must have at least one role (role_ids min length 1).
 * - Department assignment is optional (0 or more) — an explicit, different
 *   rule from roles, not an oversight (see ERD §2.1 / API Spec §4.4.2).
 * - Roles and Departments are independent many-to-many relationships,
 *   never merged into a single field.
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

    const existing = await prisma.user.findUnique({ where: { username: input.username } });
    if (existing) {
      throw new ConflictError("username", "already_exists", "שם משתמש כבר קיים במערכת");
    }

    const departmentIds = input.department_ids ?? [];

    const created = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash: hashPassword(input.password),
        fullName: input.full_name,
        siteId: input.site_id,
        status: "active",
        roles: { create: input.role_ids.map((roleId) => ({ roleId })) },
        departments: { create: departmentIds.map((departmentId) => ({ departmentId })) },
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

  public async deactivate(id: number): Promise<UserResponse> {
    await this.findOrThrow(id);
    const updated = await prisma.user.update({
      where: { id },
      data: { status: "inactive" },
      include: { roles: true, departments: true },
    });
    return toUserResponse(updated);
  }

  public async activate(id: number): Promise<UserResponse> {
    await this.findOrThrow(id);
    const updated = await prisma.user.update({
      where: { id },
      data: { status: "active" },
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
