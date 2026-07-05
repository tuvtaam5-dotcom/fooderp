export interface Role {
  id: number;
  name: string;
}

/**
 * Static role reference list, matching the 11 roles defined in the
 * Business Specification (ch. 3.3 RBAC) and RBAC Matrix.
 * No database yet — this is the temporary in-memory source of truth.
 */
export const ROLES: Role[] = [
  { id: 1, name: "מחסנאי" },
  { id: 2, name: "מנהל מחסן" },
  { id: 3, name: "מטבח" },
  { id: 4, name: "אריזה" },
  { id: 5, name: "משלוחים" },
  { id: 6, name: "מנהל ייצור" },
  { id: 7, name: "אבטחת איכות" },
  { id: 8, name: "רכש" },
  { id: 9, name: "תחזוקה" },
  { id: 10, name: "הנהלה / מנהל-ת" },
  { id: 11, name: "מנהל מערכת" },
];
