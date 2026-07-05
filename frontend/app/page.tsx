import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <section className="text-center bg-white p-10 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-slate-900">
          FoodERP
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          מערכת לניהול מפעלי מזון
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-slate-900 px-8 py-3 text-white text-lg font-semibold"
        >
          התחברות
        </Link>
      </section>
    </main>
  );
}