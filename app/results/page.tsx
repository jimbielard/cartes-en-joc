import Link from "next/link";
import { ResultsPanel } from "@/components/results-panel";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
                Cartes en Joc
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Resultats
              </h1>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                href="/session"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sessió
              </Link>
            </div>
          </div>
        </header>

        <ResultsPanel code={params.code ?? ""} />
      </div>
    </main>
  );
}
