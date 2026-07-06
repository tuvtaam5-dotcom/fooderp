import { LoginRequestBody, LoginResponse } from "./auth.types";
import { prisma } from "../../shared/prisma";
import { verifyPassword } from "../../shared/password";
import { signToken } from "../../shared/jwt";

const ACCESS_TOKEN_TTL_SECONDS = 1800; // 30 minutes, matches API Specification §2
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

/**
 * AuthService - Business logic layer for authentication.
 *
 * Sprint 25 update: replaces the Sprint 1 mock with real credential
 * validation against the `users` table (Prisma). Per Business Spec §25.6
 * and API Specification §4.4.6: a deactivated user (status=inactive) is
 * rejected with the SAME generic error as a wrong username/password —
 * never a distinct "account disabled" message, to avoid leaking account
 * existence/status (standard security practice, not a spec-stated detail
 * but a direct, uncontroversial consequence of it).
 */
export class AuthService {
  public async login(credentials: LoginRequestBody): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { username: credentials.username },
      include: { roles: true },
    });

    // Same rejection for "not found", "wrong password", and "inactive" —
    // deliberately indistinguishable from the caller's perspective.
    if (!user || user.status === "inactive") {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = verifyPassword(credentials.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const roleIds = user.roles.map((r) => r.roleId);

    const accessToken = signToken({ userId: user.id, roleIds }, ACCESS_TOKEN_TTL_SECONDS);
    const refreshToken = signToken({ userId: user.id, roleIds }, REFRESH_TOKEN_TTL_SECONDS);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      role_ids: roleIds,
    };
  }
}

export class InvalidCredentialsError extends Error {
  public statusCode = 401;
  public errorCode = "UNAUTHORIZED";
  constructor() {
    super("שם משתמש או סיסמה שגויים");
  }
}
