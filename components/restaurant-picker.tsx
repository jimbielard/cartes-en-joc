"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlaceRestaurant } from "@/lib/restaurants";
import { DEFAULT_VOTE_CATEGORIES, type VoteCategory } from "@/lib/vote-categories";
import { RestaurantSearch } from "@/components/restaurant-search";
import { VoteForm } from "@/components/vote-form";

export function RestaurantPicker({ code, initialQuery = "", restaurantId }: { code?: string; initialQuery?: string; restaurantId?: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlaceRestaurant | null>(null);
  const [selectionKey, setSelectionKey] = useState("");
  const [categories, setCategories] = useState<VoteCategory[]>(DEFAULT_VOTE_CATEGORIES);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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
  return <div className={code ? "mx-auto max-w-3xl" : "grid items-start gap-6 lg:grid-cols-2"}>
    {!code && <RestaurantSearch initialQuery={initialQuery} selectedId={selected?.id} refreshKey={refreshKey} updatedRestaurant={selected ?? undefined} onSelect={restaurant => {
      setSelected(restaurant); setSelectionKey(restaurant.id); setError("");
      requestAnimationFrame(() => document.getElementById("restaurant-vote")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }));
    }} />}
    {selected ? <VoteForm key={selectionKey} restaurant={selected} categories={categories} code={code} onSaved={restaurant => { setSelected(restaurant); setRefreshKey(key => key + 1); router.refresh(); }} /> : <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-slate-600"><h2 className="text-xl font-semibold text-slate-900">Valoracions de tota la comunitat</h2><p className="mt-3">Cerca un restaurant per veure’n la nota general, el nombre total de vots i el detall per categories. Selecciona’l per votar sobre 10.</p>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}</div>}
  </div>;
}
