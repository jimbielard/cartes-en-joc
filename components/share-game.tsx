"use client";

import { useState } from "react";

export function ShareGame({ code }: { code: string }) {
  const [message, setMessage] = useState("");
  async function share(copy = false) {
    const url = `${window.location.origin}/join?code=${encodeURIComponent(code)}`;
    try {
      if (!copy && navigator.share) await navigator.share({ title: "Cartes en Joc", text: `Entra a la partida amb el codi ${code} per votar.`, url });
      else { await navigator.clipboard.writeText(`${code}\n${url}`); setMessage("Codi i enllaç copiats."); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("No s’ha pogut compartir. Pots copiar el codi que apareix aquí.");
    }
  }
  return <section className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
    <h2 className="font-semibold text-orange-900">Comparteix la partida</h2>
    <p className="mt-2 text-sm text-orange-900">Amb aquest codi, la resta de participants podran votar el mateix restaurant.</p>
    <p className="my-3 select-all break-all text-xl font-bold text-orange-900">{code}</p>
    <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => share()} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Compartir codi</button><button type="button" onClick={() => share(true)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Copiar codi i enllaç</button></div>
    <p role="status" className="mt-2 text-sm">{message}</p>
  </section>;
}
