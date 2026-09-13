"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlaceRestaurant } from "@/lib/restaurants";
import { DEFAULT_VOTE_CATEGORIES, type VoteCategory } from "@/lib/vote-categories";
import { RestaurantSearch } from "@/components/restaurant-search";
import { VoteForm } from "@/components/vote-form";
import { RestaurantSummary } from "@/components/restaurant-summary";

export function RestaurantPicker({ code, initialQuery = "", restaurantId }: { code?: string; initialQuery?: string; restaurantId?: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlaceRestaurant | null>(null);
  const [selectionKey, setSelectionKey] = useState("");
  const [categories, setCategories] = useState<VoteCategory[]>(DEFAULT_VOTE_CATEGORIES);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [playing, setPlaying] = useState(Boolean(code));
  const [preparing, setPreparing] = useState(false);
  async function createGame() {
    if (!selected) return;
    setPreparing(true); setError("");
    try {
      let restaurant = selected;
      if (!restaurant.id.startsWith("local-")) {
        const response = await fetch("/api/restaurants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurant }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "No s’ha pogut preparar el restaurant.");
        restaurant = payload.restaurant;
      }
      router.push(`/session?restaurant=${encodeURIComponent(restaurant.id)}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Torna-ho a provar."); setPreparing(false); }
  }
  useEffect(() => {
    if (!code && !restaurantId) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(code ? `/api/sessions/${encodeURIComponent(code)}` : `/api/restaurants/${encodeURIComponent(restaurantId!)}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "No s’ha pogut carregar el restaurant.");
        if (!payload.restaurant) throw new Error("Aquesta sessió antiga no té un restaurant escollit. Cal crear una sessió nova.");
        setSelected(payload.restaurant); setSelectionKey(payload.restaurant.id);
        setCategories(payload.categories ?? DEFAULT_VOTE_CATEGORIES);
        setError("");
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "No s’ha pogut carregar el restaurant."); }
      finally { if (!controller.signal.aborted) setLoaded(true); }
    }
    void load();
    return () => controller.abort();
  }, [code, restaurantId]);
  if ((code || restaurantId) && !loaded) return <p role="status" className="p-6">Carregant el restaurant…</p>;
  if (code && error) return <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">{error}</p>;
  return <div className={selected ? "mx-auto max-w-3xl" : "w-full"}>
    {!code && selected && <button type="button" disabled={preparing} onClick={() => { setSelected(null); setPlaying(false); setError(""); }} className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Canviar restaurant</button>}
    {!code && !selected && <RestaurantSearch initialQuery={initialQuery} refreshKey={refreshKey} onSelect={restaurant => {
      setSelected(restaurant); setSelectionKey(restaurant.id); setError("");
      requestAnimationFrame(() => document.getElementById("restaurant-vote")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }));
    }} />}
    {selected && (playing ? <VoteForm key={selectionKey} restaurant={selected} categories={categories} code={code} onSaved={restaurant => { setSelected(restaurant); setRefreshKey(key => key + 1); router.refresh(); }} /> : <section id="restaurant-vote" className="rounded-3xl border border-orange-200 bg-white p-5 sm:p-6">
      <h2 className="text-2xl font-bold">{selected.name}</h2><p className="mt-2 text-slate-600">{selected.area}</p>
      <RestaurantSummary restaurant={selected} summary={selected.summary} />
      <h3 className="mt-6 text-xl font-bold">Com vols jugar?</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" disabled={preparing} onClick={() => setPlaying(true)} className="rounded-xl bg-slate-900 px-5 py-4 font-semibold text-white">Jugar sol</button><button type="button" disabled={preparing} onClick={createGame} className="rounded-xl bg-orange-600 px-5 py-4 font-semibold text-white disabled:opacity-60">{preparing ? "Preparant…" : "Crear partida"}</button></div>
      <p className="mt-3 text-sm text-slate-600">Juga sol o crea una partida per compartir el codi amb el grup.</p>
    </section>)}
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
  </div>;
}
