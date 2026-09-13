"use client";

import { useEffect, useState } from "react";
import type { PlaceRestaurant } from "@/lib/restaurants";
import { CreateRestaurantForm } from "@/components/create-restaurant-form";
import { RestaurantSummary } from "@/components/restaurant-summary";

export function RestaurantSearch({ initialQuery = "", onSelect, selectedId, refreshKey = 0, updatedRestaurant }: { initialQuery?: string; onSelect: (restaurant: PlaceRestaurant) => void; selectedId?: string; refreshKey?: number; updatedRestaurant?: PlaceRestaurant }) {
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState<{ query: string; restaurants: PlaceRestaurant[]; error: string }>({ query: "", restaurants: [], error: "" });
  const [creating, setCreating] = useState(false);
  const [manual, setManual] = useState<PlaceRestaurant | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPending(true);
      try {
        const response = await fetch(`/api/places?query=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "No s’ha pogut fer la cerca.");
        setState({ query, restaurants: payload.restaurants ?? [], error: payload.warning ?? "" });
      } catch (err) { if (!controller.signal.aborted) setState({ query, restaurants: [], error: err instanceof Error ? err.message : "No s’ha pogut fer la cerca." }); }
      finally { if (!controller.signal.aborted) setPending(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, refreshKey]);
  const results = state.query === query ? state.restaurants : [];
  const visible = (manual ? [manual, ...results.filter(r => r.id !== manual.id)] : results).map(r => r.id === updatedRestaurant?.id ? updatedRestaurant : r);
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
    <h2 className="text-2xl font-bold text-slate-900">Cercar restaurant</h2>
    <label className="mt-5 block text-sm font-medium text-slate-700">Nom, municipi o tipus de cuina<input type="search" name="q" maxLength={200} value={query} onChange={e => { setQuery(e.target.value); setManual(null); }} placeholder="Quin restaurant vols descobrir?" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300" /></label>
    <p role="status" className="mt-3 text-sm text-slate-500">{query.trim() && (pending || state.query !== query) ? "Cercant…" : `${visible.length} restaurants`}</p>
    {state.query === query && state.error && <p className="mt-2 text-sm text-amber-800">{state.error}</p>}
    <div className="mt-4 space-y-4">{visible.map(restaurant => <article key={restaurant.id} className={`rounded-2xl border p-4 ${selectedId === restaurant.id ? "border-orange-400 bg-orange-50/40" : "border-slate-200"}`}>
      <h3 className="text-lg font-semibold text-slate-900">{restaurant.name}</h3><p className="mt-1 text-sm text-slate-600">{restaurant.area} · {restaurant.type}</p>
      <RestaurantSummary summary={restaurant.summary} restaurant={restaurant} />
      <button type="button" onClick={() => onSelect(restaurant)} className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{selectedId === restaurant.id ? "Seleccionat" : "Seleccionar restaurant"}</button>
    </article>)}</div>
    <div className="mt-5 border-t border-slate-200 pt-4"><p className="text-sm text-slate-600">No el trobes?</p>{creating ? <CreateRestaurantForm initialName={query} onCancel={() => setCreating(false)} onCreated={restaurant => { setManual(restaurant); onSelect(restaurant); setCreating(false); }} /> : <button type="button" onClick={() => setCreating(true)} className="mt-2 rounded-xl border border-orange-300 px-4 py-3 text-sm font-semibold text-orange-800">Crear restaurant</button>}</div>
  </section>;
}
