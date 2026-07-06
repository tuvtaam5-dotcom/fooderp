"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  AppUser,
  Role,
  CreateUserInput,
  UpdateUserInput,
  fetchUsers,
  fetchRoles,
  createUser,
  updateUser,
  setUserStatus,
} from "@/lib/users";
import { Department, fetchDepartments } from "@/lib/departments";

export default function UsersPage() {
  const router = useRouter();

  const [checkedSession, setCheckedSession] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formRoleIds, setFormRoleIds] = useState<number[]>([]);
  const [formDepartmentIds, setFormDepartmentIds] = useState<number[]>([]);
  const [formSiteId, setFormSiteId] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Layer 1 of RBAC enforcement (UI): redirect if there is no session at all.
  // Layer 2 (the real enforcement) happens below when the API calls
  // themselves return 403 — see loadData(). This screen does not attempt to
  // decode "am I מנהל מערכת" from role_ids client-side, because resolving a
  // role_id to a role_name requires GET /v1/roles, which is ITSELF
  // restricted to מנהל מערכת (RBAC Matrix §2.15). Pre-emptively hiding the
  // nav link based on a guessed role_id would mean hardcoding an assumption
  // about seed order — the backend's 403 is the real source of truth here.
  useEffect(() => {
    const session = getAuthSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setCheckedSession(true);
  }, [router]);

  useEffect(() => {
    if (!checkedSession) return;
    loadData();
  }, [checkedSession]);

  async function loadData() {
    setIsLoading(true);
    setErrorMessage(null);
    setAccessDenied(false);
    try {
      const [usersData, rolesData, departmentsData] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchDepartments(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setDepartments(departmentsData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setAccessDenied(true);
      } else if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "שגיאה בטעינת הנתונים");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function roleName(roleId: number): string {
    return roles.find((r) => r.role_id === roleId)?.role_name ?? String(roleId);
  }

  function departmentName(departmentId: number): string {
    return departments.find((d) => d.department_id === departmentId)?.department_name ?? String(departmentId);
  }

  function openCreateForm() {
    setEditingUserId(null);
    setFormUsername("");
    setFormPassword("");
    setFormFullName("");
    setFormRoleIds([]);
    setFormDepartmentIds([]);
    setFormSiteId(1);
    setIsFormOpen(true);
  }

  function openEditForm(user: AppUser) {
    setEditingUserId(user.user_id);
    setFormUsername(user.username);
    setFormPassword(""); // never pre-filled, never sent unless changed (not implemented this sprint — edit does not change password)
    setFormFullName(user.full_name);
    setFormRoleIds(user.role_ids);
    setFormDepartmentIds(user.department_ids);
    setFormSiteId(user.site_id ?? 1);
    setIsFormOpen(true);
  }

  function toggleFormRole(roleId: number) {
    setFormRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  }

  function toggleFormDepartment(departmentId: number) {
    setFormDepartmentIds((prev) =>
      prev.includes(departmentId) ? prev.filter((id) => id !== departmentId) : [...prev, departmentId]
    );
  }

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingUserId === null) {
        const input: CreateUserInput = {
          username: formUsername,
          password: formPassword,
          full_name: formFullName,
          site_id: formSiteId,
          role_ids: formRoleIds,
          department_ids: formDepartmentIds,
        };
        await createUser(input);
      } else {
        const input: UpdateUserInput = {
          username: formUsername,
          full_name: formFullName,
          site_id: formSiteId,
          role_ids: formRoleIds,
          department_ids: formDepartmentIds,
        };
        await updateUser(editingUserId, input);
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "שגיאה בשמירת המשתמש");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(user: AppUser) {
    setErrorMessage(null);
    try {
      const nextStatus = user.status === "active" ? "inactive" : "active";
      await setUserStatus(user.user_id, nextStatus);
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "שגיאה בעדכון סטטוס המשתמש");
    }
  }

  if (!checkedSession) {
    return null;
  }

  return (
    <main className="min-h-screen flex bg-slate-100" dir="rtl">
      <aside className="w-64 shrink-0 bg-slate-900 p-6 text-white">
        <h2 className="text-xl font-bold">FoodERP</h2>

        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded-lg px-4 py-2 font-medium text-slate-300 hover:bg-slate-800">
            דשבורד
          </Link>
          <Link href="/users" className="rounded-lg bg-slate-800 px-4 py-2 font-medium">
            משתמשים
          </Link>
          <span className="rounded-lg px-4 py-2 text-slate-400">מלאי (בקרוב)</span>
          <span className="rounded-lg px-4 py-2 text-slate-400">ייצור (בקרוב)</span>
          <span className="rounded-lg px-4 py-2 text-slate-400">איכות (בקרוב)</span>
        </nav>
      </aside>

      <section className="flex-1 p-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">משתמשים והרשאות</h1>
          {!accessDenied && (
            <button onClick={openCreateForm} className="rounded-xl bg-slate-900 px-5 py-2.5 text-white font-semibold">
              + משתמש חדש
            </button>
          )}
        </div>

        {accessDenied && (
          <div className="mt-6 rounded-2xl bg-red-50 p-6 text-red-700">
            <p className="font-semibold">אין הרשאה לצפות במסך זה</p>
            <p className="mt-1 text-sm">
              מסך זה מוגבל לתפקיד &quot;מנהל מערכת&quot; בלבד (RBAC Matrix, חלק ד׳, פרק 2.15).
            </p>
            <Link href="/dashboard" className="mt-3 inline-block text-sm font-medium underline">
              חזרה לדשבורד
            </Link>
          </div>
        )}

        {!accessDenied && errorMessage && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMessage}</p>
        )}

        {!accessDenied && isFormOpen && (
          <form onSubmit={handleFormSubmit} className="mt-6 max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900">{editingUserId === null ? "משתמש חדש" : "עריכת משתמש"}</h2>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">שם משתמש</label>
              <input
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {editingUserId === null && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">סיסמה</label>
                <input
                  required
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">שם מלא</label>
              <input
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">אתר (Site)</label>
              <input
                required
                type="number"
                min={1}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5"
                value={formSiteId}
                onChange={(e) => setFormSiteId(Number(e.target.value))}
                disabled={isSaving}
              />
            </div>

            <div className="mt-4">
              <span className="block text-sm font-medium text-slate-700">תפקידים (Roles)</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <label key={role.role_id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formRoleIds.includes(role.role_id)}
                      onChange={() => toggleFormRole(role.role_id)}
                      disabled={isSaving}
                    />
                    {role.role_name}
                  </label>
                ))}
              </div>
              {formRoleIds.length === 0 && <p className="mt-1 text-xs text-red-600">יש לבחור תפקיד אחד לפחות</p>}
            </div>

            <div className="mt-4">
              <span className="block text-sm font-medium text-slate-700">מחלקות (Departments)</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {departments.map((department) => (
                  <label key={department.department_id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formDepartmentIds.includes(department.department_id)}
                      onChange={() => toggleFormDepartment(department.department_id)}
                      disabled={isSaving}
                    />
                    {department.department_name}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">שיוך מחלקה אינו חובה.</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={isSaving || formRoleIds.length === 0}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-white font-semibold disabled:opacity-50"
              >
                {isSaving ? "שומר..." : "שמירה"}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-slate-700 font-semibold"
              >
                ביטול
              </button>
            </div>
          </form>
        )}

        {!accessDenied && (
          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-lg">
            {isLoading ? (
              <p className="p-6 text-slate-500">טוען משתמשים...</p>
            ) : (
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">שם משתמש</th>
                    <th className="px-6 py-3 font-medium">סטטוס</th>
                    <th className="px-6 py-3 font-medium">תפקידים</th>
                    <th className="px-6 py-3 font-medium">מחלקות</th>
                    <th className="px-6 py-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{user.full_name}</div>
                        <div className="text-sm text-slate-500">{user.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            user.status === "active"
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                              : "rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {user.status === "active" ? "פעיל" : "מושבת"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.role_ids.map(roleName).join(", ")}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.department_ids.length > 0 ? user.department_ids.map(departmentName).join(", ") : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 text-sm">
                          <button onClick={() => openEditForm(user)} className="font-medium text-slate-900 underline">
                            עריכה
                          </button>
                          <button onClick={() => handleToggleStatus(user)} className="font-medium text-red-600 underline">
                            {user.status === "active" ? "השבתה" : "הפעלה"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
