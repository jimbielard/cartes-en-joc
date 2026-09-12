import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";
import { VoteHistory } from "@/components/vote-history";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const params = await searchParams;
  const requested = Number(params.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 10000) : 1;
  const [user, votes] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, alias: true, bio: true, email: true } }),
    prisma.vote.findMany({ where: { userId: session.user.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 21, select: { id: true, restaurantName: true, restaurantArea: true, restaurantType: true, rating: true, categoryScores: true, createdAt: true } }),
  ]);
  if (!user) redirect("/login");
  return <main className="min-h-screen bg-orange-50/50 p-4 sm:p-6"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center justify-between gap-4 py-4"><h1 className="text-3xl font-bold text-slate-900">El meu perfil</h1><Link href="/" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold">Tornar a l’inici</Link></header>
    <ProfileForm user={user} />
    <VoteHistory votes={votes.slice(0, 20)} personal />
    <nav aria-label="Pàgines de l’historial" className="mt-5 flex justify-between gap-4">
      {page > 1 ? <Link href={`/profile?page=${page - 1}`} className="underline">Més recents</Link> : <span />}
      {votes.length > 20 && <Link href={`/profile?page=${page + 1}`} className="underline">Més antics</Link>}
    </nav>
  </div></main>;
}
