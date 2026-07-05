import { CreateUserInput, UpdateUserInput, User } from "./users.types";

/**
 * In-memory user store (Sprint: Users foundation, no real DB yet).
 * Business rules enforced here match the Business Specification (ch. 25)
 * and Data Dictionary: users are never physically deleted, only
 * deactivated (status = "inactive"); every user must have at least
 * one role assigned; every user belongs to a site (site_id), with a
 * single-site deployment (siteId = 1) as the current baseline
 * (Multi-Site Readiness, Architecture doc §9 / ERD §2.10).
 *
 * TODO (Locations module): once Locations exist, add
 * responsibleLocationIds handling here (assignment/validation of
 * location ownership for warehouse-staff users).
 */
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      username: "admin",
      fullName: "מנהל/ת מערכת",
      status: "active",
      roleIds: [11],
      siteId: 1,
    },
    {
      id: 2,
      username: "test",
      fullName: "משתמש/ת בדיקה",
      status: "active",
      roleIds: [2, 5],
      siteId: 1,
    },
  ];
  private nextId = 3;

  public list(): User[] {
    return this.users;
  }

  public create(input: CreateUserInput): User {
    if (!input.roleIds || input.roleIds.length === 0) {
      throw new ValidationError("יש לשייך לפחות תפקיד אחד למשתמש");
    }

    const user: User = {
      id: this.nextId++,
      username: input.username,
      fullName: input.fullName,
      status: "active",
      roleIds: input.roleIds,
      siteId: input.siteId,
    };

    this.users.push(user);
    return user;
  }

  public update(id: number, input: UpdateUserInput): User {
    const user = this.findOrThrow(id);

    if (input.roleIds !== undefined && input.roleIds.length === 0) {
      throw new ValidationError("יש לשייך לפחות תפקיד אחד למשתמש");
    }

    if (input.username !== undefined) user.username = input.username;
    if (input.fullName !== undefined) user.fullName = input.fullName;
    if (input.roleIds !== undefined) user.roleIds = input.roleIds;
    if (input.siteId !== undefined) user.siteId = input.siteId;

    return user;
  }

  public deactivate(id: number): User {
    const user = this.findOrThrow(id);
    user.status = "inactive";
    return user;
  }

  public activate(id: number): User {
    const user = this.findOrThrow(id);
    user.status = "active";
    return user;
  }

  private findOrThrow(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundError(`משתמש עם מזהה ${id} לא נמצא`);
    }
    return user;
  }
}

export class ValidationError extends Error {
  public statusCode = 400;
}

export class NotFoundError extends Error {
  public statusCode = 404;
}
