import { getAuthSession, clearAuthSession } from "./auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Authenticated fetch — attaches the Bearer token from the stored session
 * to every request. Sprint 25 scope: every protected endpoint (/v1/users,
 * /v1/roles, /v1/departments) requires this per RBAC Matrix §2.15.
 *
 * On 401 (token missing/invalid/expired): clears the local session, since
 * there is no valid identity to keep around.
 * On 403 (valid identity, wrong role): session is NOT cleared — the user
 * is still legitimately logged in, just not authorized for this resource.
 * The caller (page component) decides how to present that.
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const session = getAuthSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  return response;
}

export async function authFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await authFetch(path, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, body.message ?? "שגיאה בתקשורת עם השרת");
  }

  return body.data as T;
}
