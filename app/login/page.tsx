import { signIn } from "@/auth";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ restaurant?: string }> }) {
  const params = await searchParams;
  const redirectTo = params.restaurant ? `/session?restaurant=${encodeURIComponent(params.restaurant)}` : "/";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffffff_40%,_#f8fafc_100%)] p-6">
      <div className="w-full max-w-lg rounded-[32px] border border-orange-100 bg-white p-8 shadow-[0_30px_80px_rgba(249,115,22,0.12)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 text-2xl font-black text-white shadow-lg shadow-orange-200">
            C
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-orange-500">
            Cartes en Joc
          </p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">Entrar a l’app</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Inicia sessió amb Google per crear sessions, votar restaurants i decidir el millor lloc amb el teu grup.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
          className="space-y-4"
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold">G</span>
            Continua amb Google
          </button>
        </form>

        <Link href="/" className="mt-5 block text-center text-sm font-semibold text-slate-700 underline">Continuar com a convidat</Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Com funciona</p>
          <p className="mt-2 leading-6">Crea una sessió, comparteix el codi, vota i descobreix quin restaurant guanya.</p>
        </div>
      </div>
    </main>
  );
}
