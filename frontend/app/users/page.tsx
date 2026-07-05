"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import {
  AppUser,
  Role,
  UserFormInput,
  fetchUsers,
  fetchRoles,
  createUser,
  updateUser,
  setUserStatus,
} from "@/lib/users";

export default function UsersPage() {
  const router = useRouter();

  const [checkedSession, setCheckedSession] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formRoleIds, setFormRoleIds] = useState<number[]>([]);
  const [formSiteId, setFormSiteId] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Guard: redirect to /login if there is no session (per security requirement).
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
    try {
      const [usersData, rolesData] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "שגיאה בטעינת הנתונים"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function roleName(roleId: number): string {
    return roles.find((r) => r.id === roleId)?.name ?? String(roleId);
  }

  function openCreateForm() {
    setEditingUserId(null);
    setFormUsername("");
    setFormFullName("");
    setFormRoleIds([]);
    setFormSiteId(1);
    setIsFormOpen(true);
  }

  function openEditForm(user: AppUser) {
    setEditingUserId(user.id);
    setFormUsername(user.username);
    setFormFullName(user.fullName);
    setFormRoleIds(user.roleIds);
    setFormSiteId(user.siteId);
    setIsFormOpen(true);
  }

  function toggleFormRole(roleId: number) {
    setFormRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  }

  // TODO (Locations module): כשקיים roleId=1 (מחסנאי) בתפקידים שנבחרו,
  // יש להציג כאן שדה בחירת מיקומי אחסון באחריות (מתוך מודול Locations),
  // ולשלוח אותו כ-responsibleLocationIds בגוף הבקשה. לא ממומש כרגע.

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const input: UserFormInput = {
      username: formUsername,
      fullName: formFullName,
      roleIds: formRoleIds,
      siteId: formSiteId,
    };

    try {
      if (editingUserId === null) {
        await createUser(input);
      } else {
        await updateUser(editingUserId, input);
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "שגיאה בשמירת המשתמש"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(user: AppUser) {
    setErrorMessage(null);
    try {
      const nextStatus = user.status === "active" ? "inactive" : "active";
      await setUserStatus(user.id, nextStatus);
      await loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "שגיאה בעדכון סטטוס המשתמש"
      );
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
          <Link
            href="/dashboard"
            className="rounded-lg px-4 py-2 font-medium text-slate-300 hover:bg-slate-800"
          >
            דשבורד
          </Link>
          <Link
            href="/users"
            className="rounded-lg bg-slate-800 px-4 py-2 font-medium"
          >
            משתמשים
          </Link>
          <span className="rounded-lg px-4 py-2 text-slate-400">
            מלאי (בקרוב)
          </span>
          <span className="rounded-lg px-4 py-2 text-slate-400">
            ייצור (בקרוב)
          </span>
          <span className="rounded-lg px-4 py-2 text-slate-400">
            איכות (בקרוב)
          </span>
        </nav>
      </aside>

      <section className="flex-1 p-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">משתמשים והרשאות</h1>
          <button
            onClick={openCreateForm}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-white font-semibold"
          >
            + משתמש חדש
          </button>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        {isFormOpen && (
          <form
            onSubmit={handleFormSubmit}
            className="mt-6 max-w-lg rounded-2xl bg-white p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold text-slate-900">
              {editingUserId === null ? "משתמש חדש" : "עריכת משתמש"}
            </h2>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                שם משתמש
              </label>
              <input
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                שם מלא
              </label>
              <input
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                אתר (Site)
              </label>
              <input
                required
                type="number"
                min={1}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5"
                value={formSiteId}
                onChange={(e) => setFormSiteId(Number(e.target.value))}
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-slate-500">
                בפריסה הנוכחית קיים אתר יחיד (1). שדה זה מוכן להרחבה עתידית
                לריבוי אתרים (ראו Architecture — Multi-Site Readiness).
              </p>
            </div>

            <div className="mt-4">
              <span className="block text-sm font-medium text-slate-700">
                תפקידים
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={formRoleIds.includes(role.id)}
                      onChange={() => toggleFormRole(role.id)}
                      disabled={isSaving}
                    />
                    {role.name}
                  </label>
                ))}
              </div>
              {formRoleIds.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  יש לבחור תפקיד אחד לפחות
                </p>
              )}
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

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          {isLoading ? (
            <p className="p-6 text-slate-500">טוען משתמשים...</p>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-slate-100 text-sm text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-medium">שם משתמש</th>
                  <th className="px-6 py-3 font-medium">אתר</th>
                  <th className="px-6 py-3 font-medium">סטטוס</th>
                  <th className="px-6 py-3 font-medium">תפקידים</th>
                  <th className="px-6 py-3 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {user.fullName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.siteId}
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
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.roleIds.map(roleName).join(", ")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-sm">
                        <button
                          onClick={() => openEditForm(user)}
                          className="font-medium text-slate-900 underline"
                        >
                          עריכה
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="font-medium text-red-600 underline"
                        >
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
      </section>
    </main>
  );
}
