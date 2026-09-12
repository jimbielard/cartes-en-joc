"use client";

import { useState, type FormEvent } from "react";
import type { PlaceRestaurant } from "@/lib/restaurants";

export function CreateRestaurantForm({ initialName, onCreated, onCancel }: { initialName: string; onCreated: (restaurant: PlaceRestaurant) => void; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/restaurants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No s’ha pogut crear el restaurant.");
      onCreated(payload.restaurant);
    } catch (err) { setError(err instanceof Error ? err.message : "No s’ha pogut crear el restaurant."); }
    finally { setSaving(false); }
  }
  const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300";
  return <form onSubmit={submit} className="mt-4 border-t border-orange-200 pt-5">
    <h3 className="text-lg font-bold text-slate-900">Crear restaurant</h3>
    <p className="mt-2 text-sm text-slate-600">El restaurant quedarà disponible per a tothom a l’app.</p>
    <fieldset disabled={saving} className="mt-4 space-y-4">
      <label className="block text-sm font-medium text-slate-700">Nom del restaurant<input autoFocus name="name" required maxLength={120} defaultValue={initialName.slice(0, 120)} className={input} /></label>
      <label className="block text-sm font-medium text-slate-700">Adreça i municipi<input name="area" required maxLength={200} placeholder="Carrer Major, 12, Girona" className={input} /></label>
      <label className="block text-sm font-medium text-slate-700">Tipus de cuina<input name="cuisine" required maxLength={80} placeholder="Catalana, italiana, japonesa…" className={input} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3"><button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{saving ? "Desant…" : "Desar i seleccionar"}</button><button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold">Cancel·lar</button></div>
    </fieldset>
  </form>;
}
