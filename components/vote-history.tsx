import Link from "next/link";
import { averageCategoryScores } from "@/lib/vote-categories";

export type HistoryVote = {
  id: string;
  restaurantName: string;
  restaurantArea: string | null;
  restaurantType: string | null;
  rating: number | null;
  categoryScores: unknown;
  createdAt: Date;
};

export function VoteHistory({ votes, personal = false }: { votes: HistoryVote[]; personal?: boolean }) {
  return (
    <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900">{personal ? "Els meus restaurants votats" : "Últims restaurants votats"}</h2>
      <p className="mt-2 text-sm text-slate-600">{personal ? "Les teves valoracions, de la més recent a la més antiga." : "Descobreix els restaurants que està valorant la comunitat."}</p>
      {votes.length ? <ul className="mt-6 divide-y divide-slate-100">
        {votes.map(vote => <li key={vote.id} className="flex items-center justify-between gap-4 py-5">
          <div className="min-w-0">
            <Link href={`/restaurants?q=${encodeURIComponent(vote.restaurantName)}`} className="break-words text-lg font-semibold text-slate-900 underline-offset-4 hover:underline">{vote.restaurantName}</Link>
            <p className="mt-1 text-sm text-slate-600">{[vote.restaurantArea, vote.restaurantType].filter(Boolean).join(" · ")}</p>
            <time dateTime={vote.createdAt.toISOString()} className="mt-1 block text-xs text-slate-500">{new Intl.DateTimeFormat("ca", { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(vote.createdAt)}</time>
          </div>
          <span className="shrink-0 font-bold text-orange-700">{averageCategoryScores(vote.categoryScores) === null ? "Sense nota" : `${averageCategoryScores(vote.categoryScores)!.toFixed(1)} / 10`}</span>
        </li>)}
      </ul> : <p className="mt-6 rounded-xl bg-orange-50 p-5 text-slate-600">{personal ? "Encara no has votat cap restaurant." : "Encara no hi ha restaurants votats. Sigues el primer a compartir una valoració."}</p>}
    </section>
  );
}
