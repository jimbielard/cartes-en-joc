"use client";

import { useEffect, useMemo, useState } from "react";

type Vote = {
  user: {
    id: string;
    name: string | null;
  };
  restaurantName: string;
  restaurantArea: string | null;
  restaurantType: string | null;
  rating: number | null;
};

type SessionData = {
  code: string;
  name: string;
  location: string | null;
  participants: Array<{ id: string; name: string; userId: string | null }>;
  votes: Vote[];
};

function formatName(name: string | null) {
  return name ?? "Usuari";
}

export function ResultsPanel({ code }: { code: string }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const response = await fetch(`/api/sessions/${encodeURIComponent(code)}`, { signal: controller.signal, cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "No s’ha pogut carregar la sessió");
        }

        setSession(payload);
        setError("");
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No s’ha pogut carregar la sessió",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(load, 5000);
        }
      }
    };

    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [code]);

  const standings = useMemo<Array<{ name: string; votes: number; avg: number; area: string | null; type: string | null }>>(() => {
    if (!session?.votes?.length) return [];

    const map = new Map<string, { name: string; votes: number; total: number; area: string | null; type: string | null }>();

    for (const vote of session.votes) {
      const key = vote.restaurantName;
      const current = map.get(key) ?? {
        name: vote.restaurantName,
        votes: 0,
        total: 0,
        area: vote.restaurantArea,
        type: vote.restaurantType,
      };

      current.votes += 1;
      current.total += vote.rating ?? 0;
      current.area = vote.restaurantArea ?? current.area;
      current.type = vote.restaurantType ?? current.type;
      map.set(key, current);
    }

    return Array.from(map.values())
      .map((item) => ({
        name: item.name,
        votes: item.votes,
        avg: item.votes ? item.total / item.votes : 0,
        area: item.area,
        type: item.type,
      }))
      .sort((a, b) => b.votes - a.votes || b.avg - a.avg);
  }, [session]);

  const winner = standings[0];

  if (!code) return <p>Falta el codi de la sessió.</p>;

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">Carregant resultats…</div>;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
          Resultats
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">{session?.name ?? "Sessió"}</h2>
        <p className="mt-2 text-sm text-slate-500">Codi: {session?.code ?? code}</p>

        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-600">
            Guanyador
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {winner ? winner.name : "Encara no hi ha votacions"}
          </h3>
          {winner ? (
            <p className="mt-2 text-sm text-slate-600">
              {winner.votes} vots · mitjana {winner.avg.toFixed(1)} / 10
            </p>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          {standings.length ? (
            standings.map((item, index) => (
              <div
                key={item.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    #{index + 1} {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.area ?? "—"} · {item.type ?? "—"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.votes} vots</p>
                  <p className="text-xs text-slate-500">{item.avg.toFixed(1)} / 10</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Encara no hi ha vots registrats.
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
          Participants
        </p>
        <div className="mt-5 space-y-2">
          {session?.participants?.length ? (
            session.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-700">
                  {participant.name}
                </span>
                <span className="text-xs text-slate-500">
                  {session.votes.some((vote) => vote.user.id === participant.userId)
                    ? "Ha votat"
                    : "Sense vot"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No hi ha participants.</p>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Vots
          </p>
          <div className="mt-3 space-y-2">
            {session?.votes?.length ? (
              session.votes.map((vote, index) => (
                <div key={`${vote.user.id}-${index}`} className="text-sm text-slate-700">
                  <span className="font-semibold">{formatName(vote.user.name)}</span> · {vote.restaurantName}
                  {vote.rating !== null ? ` · ${vote.rating.toFixed(1)}/10` : ""}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No hi ha vots encara.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
