"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthSession, clearAuthSession, getAuthSession } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const currentSession = getAuthSession();

    if (!currentSession) {
      router.push("/login");
      return;
    }

    setSession(currentSession);
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen flex bg-slate-100" dir="rtl">
      <aside className="w-64 shrink-0 bg-slate-900 p-6 text-white">
        <h2 className="text-xl font-bold">FoodERP</h2>

        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <span className="rounded-lg bg-slate-800 px-4 py-2 font-medium">
            דשבורד
          </span>
          <Link
            href="/users"
            className="rounded-lg px-4 py-2 text-slate-300 hover:bg-slate-800"
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

        <button
          onClick={handleLogout}
          className="mt-10 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
        >
          התנתקות
        </button>
      </aside>

      <section className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-slate-900">FoodERP</h1>

        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-green-700 font-medium">
          התחברת בהצלחה
        </p>

        <p className="mt-6 text-slate-600">
          שם משתמש: <span className="font-semibold">{session.username}</span>
        </p>
        <p className="mt-1 text-slate-600">
          מזהי תפקידים (role_ids): <span className="font-semibold">{session.roleIds.join(", ")}</span>
        </p>
      </section>
    </main>
  );
}
