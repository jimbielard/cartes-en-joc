import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import { RestaurantPicker } from "@/components/restaurant-picker";
import { RestaurantSummary } from "@/components/restaurant-summary";
import { attachSummaries } from "@/lib/restaurant-store";
import { toPlaceRestaurant } from "@/lib/restaurants";

export default async function HomePage() {
  const session = await auth();
  const recent = await prisma.vote.findMany({ where: { restaurantId: { not: null } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], distinct: ["restaurantId"], take: 12, include: { restaurant: true } });
  const restaurants = await attachSummaries(recent.flatMap(vote => vote.restaurant ? [toPlaceRestaurant(vote.restaurant)] : []));
  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffe4e6_35%,_#fffaf5_100%)] p-4 text-slate-800 sm:p-6"><div className="mx-auto max-w-6xl">
    <header className="mb-6 rounded-3xl border border-pink-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div><Link href="/" className="font-bold text-pink-700">Cartes en Joc</Link><h1 className="mt-3 text-3xl font-bold text-slate-900">{session?.user ? `Hola, ${session.user.name ?? "usuari"}` : "Descobreix i valora restaurants"}</h1></div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-emerald-800">{session?.user ? "Connectat" : "Convidat"}</span>
          {session?.user ? <><Link href="/profile" className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold">El meu perfil</Link><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className="rounded-full border border-pink-200 px-4 py-3 text-sm font-semibold text-pink-800">Tancar sessió</button></form></> : <Link href="/login" className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Iniciar sessió amb Google</Link>}
        </div>
      </div>
      <nav aria-label="Sessions" className="mt-5 flex flex-wrap gap-3"><Link href="/session" className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white">Crear sessió</Link><Link href="/join" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold">Entrar amb codi</Link></nav>
    </header>
    <RestaurantPicker />
    <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5 sm:p-6"><h2 className="text-2xl font-bold text-slate-900">Últims restaurants votats</h2><p className="mt-2 text-sm text-slate-600">La puntuació general inclou totes les valoracions de l’app.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{restaurants.map(restaurant => <article key={restaurant.id} className="rounded-2xl border border-slate-200 p-5"><Link href={`/restaurants?id=${restaurant.id}`} className="text-lg font-bold text-slate-900 underline-offset-4 hover:underline">{restaurant.name}</Link><p className="mt-1 text-sm text-slate-600">{restaurant.area} · {restaurant.type}</p><RestaurantSummary summary={restaurant.summary} restaurant={restaurant} /></article>)}</div>
      {!restaurants.length && <p className="mt-5 text-slate-600">Encara no hi ha restaurants votats. Cerca’n un i comparteix la primera valoració.</p>}
    </section>
  </div></main>;
}
