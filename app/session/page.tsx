import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionSetup } from "@/components/session-setup";
import { prisma } from "@/lib/prisma";
import { toPlaceRestaurant } from "@/lib/restaurants";

export default async function SessionPage({ searchParams }: { searchParams: Promise<{ restaurant?: string; q?: string }> }) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?restaurant=${encodeURIComponent(params.restaurant ?? "")}`);
  }
  const restaurant = params.restaurant ? await prisma.restaurant.findUnique({ where: { id: params.restaurant.replace(/^local-/, "") } }) : null;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
                Cartes en Joc
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                Sessions
              </h1>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Tornar a la home
            </Link>
          </div>
        </header>

        <SessionSetup initialRestaurant={restaurant ? toPlaceRestaurant(restaurant) : null} initialQuery={params.q ?? ""} />
      </div>
    </main>
  );
}
