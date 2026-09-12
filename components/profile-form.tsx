"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({ user }: { user: { name: string | null; alias: string | null; bio: string | null; email: string } }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No s’han pogut desar les dades.");
      setMessage("Dades desades correctament.");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "No s’han pogut desar les dades."); }
    finally { setSaving(false); }
  }
  const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100";
  return <form onSubmit={save} className="mt-6 rounded-3xl border border-orange-100 bg-white p-6 sm:p-8">
    <h2 className="text-xl font-bold text-slate-900">Les meves dades</h2>
    <fieldset disabled={saving} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Nom<input name="name" required maxLength={80} autoComplete="name" defaultValue={user.name ?? ""} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Àlies<input name="alias" maxLength={40} defaultValue={user.alias ?? ""} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Correu del compte de Google<input type="email" readOnly value={user.email} className={`${inputClass} text-slate-500`} /><span className="mt-2 block text-xs text-slate-500">El correu està vinculat al compte amb què inicies sessió.</span></label>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Sobre mi<textarea name="bio" rows={4} maxLength={500} defaultValue={user.bio ?? ""} className={inputClass} /><span className="mt-1 block text-xs text-slate-500">Màxim 500 caràcters.</span></label>
    </fieldset>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p>
    <button disabled={saving} className="mt-4 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60">{saving ? "Desant…" : "Desar canvis"}</button>
  </form>;
}
