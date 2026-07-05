export type UserStatus = "active" | "inactive";

export interface User {
  id: number;
  username: string;
  fullName: string;
  status: UserStatus;
  roleIds: number[];
  siteId: number;
  // TODO (Locations module): הוספת שדה responsibleLocationIds: number[]
  // לשיוך מיקומי אחסון באחריות משתמשי roleId=1 (מחסנאי), לפי
  // Data Dictionary (location_managers, יחס רבים-לרבים). יתווסף רק
  // לאחר שמודול Locations קיים, עם בחירה מרשימת מיקומים אמיתית —
  // לא כשדה טקסט/מספרים זמני.
}

export interface CreateUserInput {
  username: string;
  fullName: string;
  roleIds: number[];
  siteId: number;
}

export interface UpdateUserInput {
  username?: string;
  fullName?: string;
  roleIds?: number[];
  siteId?: number;
}
