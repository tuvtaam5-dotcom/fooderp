export interface UserResponse {
  user_id: number;
  username: string;
  full_name: string;
  status: "active" | "inactive";
  site_id: number | null;
  role_ids: number[];
  department_ids: number[];
}

export interface CreateUserInput {
  username: string;
  password: string;
  full_name: string;
  site_id: number;
  role_ids: number[];
  department_ids?: number[];
}

export interface UpdateUserInput {
  username?: string;
  full_name?: string;
  site_id?: number;
  role_ids?: number[];
  department_ids?: number[];
}
