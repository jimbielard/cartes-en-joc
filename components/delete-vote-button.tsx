"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteVoteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setDeleting(true); setError("");
    try {
      const response = await fetch(`/api/votes/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No s’ha pogut eliminar la valoració.");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "No s’ha pogut eliminar la valoració."); setDeleting(false); }
  }
  return <div className="mt-3">
    {!confirming ? <button type="button" onClick={() => setConfirming(true)} aria-label={`Eliminar la meva valoració de ${name}`} className="py-2 text-sm font-medium text-red-700 underline underline-offset-4">Eliminar</button> :
      <div className="space-y-2">
        <p className="text-sm text-slate-600">Vols eliminar la teva valoració? No es pot desfer.</p>
        <div className="flex flex-wrap gap-3"><button type="button" disabled={deleting} onClick={remove} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{deleting ? "Eliminant…" : "Eliminar valoració"}</button><button type="button" disabled={deleting} onClick={() => { setConfirming(false); setError(""); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Cancel·lar</button></div>
      </div>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
