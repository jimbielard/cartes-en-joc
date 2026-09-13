import Link from "next/link";
import { RestaurantPicker } from "@/components/restaurant-picker";

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; q?: string; id?: string }>;
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
                Restaurants
              </h1>
            </div>

            <div className="flex gap-3">
              <Link
                href="/session"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Crear sessió
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Home
              </Link>
            </div>
          </div>
        </header>

        {params.code && <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Codi de la sessió: <span className="font-semibold text-slate-900">{params.code ?? "No disponible"}</span>
        </div>}

        <RestaurantPicker key={`${params.code ?? ""}-${params.q ?? ""}-${params.id ?? ""}`} code={params.code} initialQuery={params.q ?? ""} restaurantId={params.id} />
      </div>
    </main>
  );
}
