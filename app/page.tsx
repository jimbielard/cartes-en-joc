import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VoteHistory } from "@/components/vote-history";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const votes = await prisma.vote.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 12, select: { id: true, restaurantName: true, restaurantArea: true, restaurantType: true, rating: true, categoryScores: true, createdAt: true } });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffe4e6_35%,_#fffaf5_100%)] p-6 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-[32px] border-2 border-pink-200 bg-white/80 p-6 shadow-[0_24px_80px_rgba(236,72,153,0.12)] backdrop-blur-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-pink-700">
                <span className="inline-block h-2 w-2 rounded-full bg-pink-500" />
                Cartes en Joc
              </div>
              <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">
                Benvingut/da, {session.user.name ?? "usuari"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Connectat
              </span>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-bold text-pink-700 transition hover:-translate-y-0.5 hover:bg-pink-100"
                >
                  Tancar sessió
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-orange-100 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">Quin restaurant vols descobrir?</h2>
          <form action="/restaurants" className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="flex-1"><span className="sr-only">Cerca per nom, zona o tipus de cuina</span><input type="search" name="q" required maxLength={200} placeholder="Nom, zona o tipus de cuina..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-orange-500 focus:outline-none" /></label>
            <button className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white">Cercar restaurant</button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Cercar restaurant",
              value: "Google Places",
              href: "/restaurants",
              badge: "Acció principal",
              className: "bg-gradient-to-br from-orange-100 to-pink-50 border-orange-200",
            },
            {
              title: "Crear sessió",
              value: "Nova partida",
              href: "/session",
              badge: "Sessió",
              className: "bg-gradient-to-br from-pink-100 to-rose-50 border-pink-200",
            },
            {
              title: "Entrar amb codi",
              value: "Uneix-te al grup",
              href: "/join",
              badge: "Participació",
              className: "bg-gradient-to-br from-emerald-50 to-lime-50 border-emerald-200",
            },
            {
              title: "El meu perfil",
              value: "Dades personals",
              href: "/profile",
              badge: "Compte",
              className: "bg-gradient-to-br from-slate-100 to-white border-slate-200",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`rounded-[28px] border-2 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(236,72,153,0.12)] ${item.className}`}
            >
              <div className="mb-3 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-pink-700">
                {item.badge}
              </div>
              <h2 className="text-lg font-black text-slate-900">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.value}</p>
            </Link>
          ))}
        </section>
        <VoteHistory votes={votes} />
      </div>
    </main>
  );
}
