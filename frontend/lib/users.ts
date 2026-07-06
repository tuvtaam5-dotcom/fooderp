import { authFetchJson } from "./api";

export interface Role {
  role_id: number;
  role_name: string;
}

export type UserStatus = "active" | "inactive";

export interface AppUser {
  user_id: number;
  username: string;
  full_name: string;
  status: UserStatus;
  status_change_reason: string | null;
  site_id: number | null;
  role_ids: number[];
  department_ids: number[];
  // TODO (Locations module): department_ids already covers the "מחסנים"
  // department; a separate responsible_location_ids will be added here
  // and in the /users screen once the Locations module exists (per ch25
  // TODO already documented in the ERD/Data Dictionary).
}

export interface CreateUserInput {
  username: string;
  password: string;
  full_name: string;
  site_id: number;
  role_ids: number[];
  department_ids: number[];
}

export interface UpdateUserInput {
  username?: string;
  full_name?: string;
  site_id?: number;
  role_ids?: number[];
  department_ids?: number[];
}

export function fetchUsers(): Promise<AppUser[]> {
  return authFetchJson<AppUser[]>("/v1/users");
}

export function fetchRoles(): Promise<Role[]> {
  return authFetchJson<Role[]>("/v1/roles");
}

export function createUser(input: CreateUserInput): Promise<AppUser> {
  return authFetchJson<AppUser>("/v1/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(id: number, input: UpdateUserInput): Promise<AppUser> {
  return authFetchJson<AppUser>(`/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function setUserStatus(id: number, status: UserStatus, reason: string): Promise<AppUser> {
  const action = status === "active" ? "activate" : "deactivate";
  return authFetchJson<AppUser>(`/v1/users/${id}/${action}`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}
