"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlaceRestaurant } from "@/lib/restaurants";
import { averageCategoryScores, buildCategoryScores, type VoteCategory } from "@/lib/vote-categories";
import { RestaurantSummary } from "@/components/restaurant-summary";

export function VoteForm({ restaurant, categories, code, onSaved }: { restaurant: PlaceRestaurant; categories: VoteCategory[]; code?: string; onSaved: (restaurant: PlaceRestaurant) => void }) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const categoryScores = buildCategoryScores(categories, scores);
  const rating = averageCategoryScores(categoryScores);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (rating === null) { setError("Puntua almenys una categoria sobre 10."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, restaurant, categoryScores }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No s’ha pogut desar el vot.");
      onSaved(payload.restaurant); setMessage("Valoració desada. Ja forma part de la puntuació general del restaurant.");
    } catch (err) { setError(err instanceof Error ? err.message : "No s’ha pogut desar el vot."); }
    finally { setSaving(false); }
  }
  return <section id="restaurant-vote" className="rounded-3xl border border-orange-200 bg-white p-5 sm:p-6">
    <h2 className="text-2xl font-bold text-slate-900">{restaurant.name}</h2><p className="mt-2 text-sm text-slate-600">{restaurant.area}</p>
    {code && <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm text-orange-900">Restaurant escollit per a la sessió {code}. Tots els participants voten aquest restaurant.</p>}
    <RestaurantSummary summary={restaurant.summary} restaurant={restaurant} />
    <form onSubmit={save} className="mt-6">
      <h3 className="text-lg font-bold text-slate-900">Vota sobre 10</h3><p className="mt-2 text-sm text-slate-600">Puntua cada categoria de 0 a 10. Pots deixar en blanc les que no puguis valorar.</p>
      <fieldset disabled={saving} className="mt-4 grid gap-3 sm:grid-cols-2">{categories.filter(c => c.visible).map(category => <label key={category.key} className="text-xs font-semibold text-slate-700">{category.label}<input type="number" min={0} max={10} step="0.1" inputMode="decimal" value={scores[category.key] ?? ""} onChange={e => setScores(current => ({ ...current, [category.key]: e.target.value }))} placeholder="0–10" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base" /></label>)}</fieldset>
      <p className="mt-5 text-sm text-slate-600">La teva nota: <output aria-live="polite" className="text-xl font-bold text-orange-800">{rating === null ? "Sense puntuar" : `${rating.toFixed(1)} / 10`}</output></p>
      <p className="mt-1 text-xs text-slate-500">Mitjana de les categories puntuades. El zero compta; les buides no.</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<p role="status" className="mt-4 text-sm text-emerald-800">{message}</p>
      <button disabled={saving} className="mt-4 w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Desant…" : "Desar valoració"}</button>
      <p className="mt-3 text-xs text-slate-500">Pots votar sense registre. Si votes com a convidat, aquest navegador recordarà la teva valoració.</p>
    </form>
    {code ? <Link href={`/results?code=${encodeURIComponent(code)}`} className="mt-4 inline-block text-sm font-semibold underline">Veure els resultats de la sessió</Link> : <Link href={restaurant.id.startsWith("local-") ? `/session?restaurant=${encodeURIComponent(restaurant.id)}` : `/session?q=${encodeURIComponent(restaurant.name)}`} className="mt-4 inline-block text-sm font-semibold underline">Crear una sessió amb aquest restaurant</Link>}
  </section>;
}
