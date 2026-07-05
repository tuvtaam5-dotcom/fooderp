import { API_BASE_URL } from "./api";

export interface Role {
  id: number;
  name: string;
}

export type UserStatus = "active" | "inactive";

export interface AppUser {
  id: number;
  username: string;
  fullName: string;
  status: UserStatus;
  roleIds: number[];
  siteId: number;
  // TODO (Locations module): responsibleLocationIds: number[] יתווסף כאן
  // ובמסך /users, כשדה בחירה ממודול Locations (לא כטקסט חופשי).
}

export interface UserFormInput {
  username: string;
  fullName: string;
  roleIds: number[];
  siteId: number;
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "שגיאה בתקשורת עם השרת");
  }
  const body = await response.json();
  return body.data as T;
}

export async function fetchUsers(): Promise<AppUser[]> {
  const res = await fetch(`${API_BASE_URL}/v1/users`);
  return handle<AppUser[]>(res);
}

export async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`${API_BASE_URL}/v1/roles`);
  return handle<Role[]>(res);
}

export async function createUser(input: UserFormInput): Promise<AppUser> {
  const res = await fetch(`${API_BASE_URL}/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<AppUser>(res);
}

export async function updateUser(
  id: number,
  input: UserFormInput
): Promise<AppUser> {
  const res = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<AppUser>(res);
}

export async function setUserStatus(
  id: number,
  status: UserStatus
): Promise<AppUser> {
  const action = status === "active" ? "activate" : "deactivate";
  const res = await fetch(`${API_BASE_URL}/v1/users/${id}/${action}`, {
    method: "PATCH",
  });
  return handle<AppUser>(res);
}
