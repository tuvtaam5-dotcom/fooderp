import { authFetchJson } from "./api";

export interface Department {
  department_id: number;
  department_name: string;
}

export function fetchDepartments(): Promise<Department[]> {
  return authFetchJson<Department[]>("/v1/departments");
}
