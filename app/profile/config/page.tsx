import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const designs = [
  { name: "A · Sobretaula", description: "Format de revista gastronòmica, tons crema i terracota, i tipografia amb serifa.", href: "/designs/editorial.html", colors: ["#f0e7d6", "#7b3928", "#302c24"] },
  { name: "B · El directori", description: "Format d’aplicació minimalista, amb menú lateral, llistes compactes i filtres.", href: "/designs/directory.html", colors: ["#e4e9ed", "#23614e", "#1e2b37"] },
  { name: "C · Club de taula", description: "Estil nocturn, amb verd profund, accents daurats i fotografia protagonista.", href: "/designs/night.html", colors: ["#111816", "#d4ba85", "#536558"] },
  { name: "D · A taula!", description: "Composició de cartell, tipografia gran i geomètrica, i vermell corall.", href: "/designs/graphic.html", colors: ["#e2462c", "#dedecf", "#20211f"] },
];

export default async function ProfileConfigPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <main className="min-h-screen bg-orange-50/50 p-4 sm:p-6"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center justify-between gap-4 py-4">
      <h1 className="text-3xl font-bold text-slate-900">Configuració</h1>
      <Link href="/profile" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold">Tornar al meu perfil</Link>
    </header>
    <nav aria-label="Menú del perfil" className="mt-4 flex flex-wrap gap-3">
      <Link href="/profile" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Les meves dades i votacions</Link>
      <Link href="/profile/config" aria-current="page" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Configuració</Link>
    </nav>
    <section className="mt-6 rounded-3xl border border-orange-100 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900">Disseny de l’aplicació</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Explora les quatre propostes abans d’escollir. Són previsualitzacions: obrir-les no canvia el disseny actual.</p>
      <ul className="mt-6 divide-y divide-slate-200">
        {designs.map(design => <li key={design.href} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div aria-hidden="true" className="mb-3 flex gap-1.5">{design.colors.map(color => <span key={color} className="h-3 w-8 rounded-sm" style={{ backgroundColor: color }} />)}</div>
            <h3 className="text-lg font-semibold text-slate-900">{design.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{design.description}</p>
          </div>
          <a href={design.href} className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50" aria-label={`Veure ${design.name}`}>Veure disseny</a>
        </li>)}
      </ul>
      <a href="/designs/index.html" className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">Comparar els quatre dissenys</a>
    </section>
  </div></main>;
}
