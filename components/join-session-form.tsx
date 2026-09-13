"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";

export function JoinSessionForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setError("Introdueix un codi de sessió.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(normalizedCode)}`, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Sessió no trobada");
      }

      router.push(`/restaurants?code=${encodeURIComponent(normalizedCode)}`);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "No s’ha pogut entrar a la sessió",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
        Entrar amb codi
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">
        Uneix-te a una sessió
      </h1>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Codi de la sessió
          </span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="JDC-ABCD"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Entrant..." : "Entrar a la sessió"}
        </button>
      </div>
    </div>
  );
}
