import { LoginRequestBody, LoginResponse } from "./auth.types";

/**
 * AuthService - Business logic layer for authentication.
 *
 * NOTE (Sprint 1 - Foundation):
 * This is a MOCK implementation. No database access, no password
 * verification, and no real JWT issuance are implemented yet.
 * The method signature and return type already match the final API
 * contract, so the mock body can be replaced later without changing
 * the controller or route layer.
 */
export class AuthService {
  public async login(_credentials: LoginRequestBody): Promise<LoginResponse> {
    // TODO (future sprint): validate credentials against the users table (Prisma).
    // TODO (future sprint): issue a real JWT access_token + refresh_token.
    // TODO (future sprint): resolve role_ids from the user_roles table (RBAC).

    return {
      access_token: "mock_access_token",
      refresh_token: "mock_refresh_token",
      expires_in: 1800,
      role_ids: [2, 5],
    };
  }
}
