"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  role_ids: number[];
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("שם משתמש או סיסמה שגויים");
      }

      const data: LoginResponse = await response.json();

      saveAuthSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        roleIds: data.role_ids,
        username,
      });

      setSuccessMessage("ההתחברות בוצעה בהצלחה");
      router.push("/dashboard");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "אירעה שגיאה בהתחברות"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100" dir="rtl">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-slate-900">
          התחברות
        </h1>

        <p className="mt-2 text-slate-600">
          כניסה למערכת FoodERP
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700">
              שם משתמש
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="הקלידי שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              סיסמה
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="הקלידי סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {successMessage && (
            <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold disabled:opacity-50"
          >
            {isLoading ? "מתחברת..." : "התחברות"}
          </button>
        </form>
      </section>
    </main>
  );
}
