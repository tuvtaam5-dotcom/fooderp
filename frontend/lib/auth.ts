export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  roleIds: number[];
  username: string;
}

const STORAGE_KEY = "fooderp_auth_session";

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
