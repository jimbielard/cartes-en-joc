import type { RestaurantSummary as Summary } from "@/lib/restaurant-summary";
import { DEFAULT_VOTE_CATEGORIES } from "@/lib/vote-categories";
import { RestaurantLinks } from "@/components/restaurant-links";
import type { PlaceRestaurant } from "@/lib/restaurants";

export function RestaurantSummary({ summary, restaurant }: { summary?: Summary; restaurant?: PlaceRestaurant }) {
  const categories = summary?.categories ?? DEFAULT_VOTE_CATEGORIES.map(c => ({ ...c, average: null, votes: 0 }));
  return <div className="mt-4 border-t border-slate-200 pt-4">
    <p className="text-sm text-slate-700"><strong className="text-lg text-orange-800">{summary?.average == null ? "Sense puntuació" : `${summary.average.toFixed(1)} / 10`}</strong><span className="ml-3">{summary?.totalVotes ?? 0} valoracions totals</span></p>
    <p className="mt-1 text-xs text-slate-500">De tota l’app: vots individuals i de sessions, d’usuaris i convidats.</p>
    <details className="mt-3">
      <summary className="cursor-pointer py-2 text-sm font-semibold text-slate-800">Veure valoracions per categories</summary>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">{categories.map(category => <div key={category.key} className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-xs"><dt>{category.label}</dt><dd className="text-right">{category.average === null ? "Sense vots" : `${category.average.toFixed(1)} / 10`}<span className="block text-slate-500">{category.votes} vots</span></dd></div>)}</dl>
    </details>
    {restaurant && <RestaurantLinks name={restaurant.name} area={restaurant.area} googlePlaceId={restaurant.googlePlaceId} />}
  </div>;
}
