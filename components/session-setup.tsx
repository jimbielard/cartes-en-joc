"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";

import { DEFAULT_VOTE_CATEGORIES } from "@/lib/vote-categories";
import { RestaurantSearch } from "@/components/restaurant-search";
import type { PlaceRestaurant } from "@/lib/restaurants";

const starterParticipants: Array<{ id: number; name: string; isHost?: boolean }> = [];

export function SessionSetup({ initialRestaurant = null, initialQuery = "" }: { initialRestaurant?: PlaceRestaurant | null; initialQuery?: string }) {
  const router = useRouter();
  const [sessionName, setSessionName] = useState("Sessió de restaurants");
  const [location, setLocation] = useState("Barcelona");
  const [participants, setParticipants] = useState(starterParticipants);
  const [categories, setCategories] = useState(
    DEFAULT_VOTE_CATEGORIES.map((category) => ({ ...category })),
  );
  const [newParticipant, setNewParticipant] = useState("");
  const [created, setCreated] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<PlaceRestaurant | null>(initialRestaurant);

  const addParticipant = () => {
    const trimmed = newParticipant.trim();
    if (!trimmed) return;

    setParticipants((current) => [
      ...current,
      { id: Date.now(), name: trimmed },
    ]);
    setNewParticipant("");
  };

  const toggleCategory = (key: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.key === key
          ? { ...category, visible: !category.visible }
          : category,
      ),
    );
  };

  const handleCreateSession = async () => {
    if (!restaurant) { setError("Escull el restaurant de la sessió."); return; }
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          location,
          participants: participants.map((participant) => participant.name),
          categories,
          restaurant,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "No s’ha pogut crear la sessió");
      }

      setCode(payload.code);
      setCreated(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No s’ha pogut crear la sessió",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToVoting = () => {
    if (!code) return;
    router.push(`/restaurants?code=${encodeURIComponent(code)}`);
  };

  return (
    <div>
      {!created && <div className="mb-6"><RestaurantSearch initialQuery={initialQuery} selectedId={restaurant?.id} onSelect={setRestaurant} /></div>}
      {restaurant && <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-5"><p className="font-semibold text-orange-900">Restaurant de la sessió: {restaurant.name}</p><p className="mt-1 text-sm text-orange-800">{restaurant.area}</p><p className="mt-2 text-sm text-orange-800">Tothom que entri amb el codi votarà aquest restaurant.</p></div>}
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
              Nova sessió
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Configura la partida
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCreateSession}
            disabled={saving || created || !restaurant}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Creant..." : "Crear sessió"}
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <fieldset disabled={saving || created} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Nom de la sessió
            </span>
            <input
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
              placeholder="Sessió de restaurants"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Localització
            </span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
              placeholder="Barcelona"
            />
          </label>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Participants</p>
              <span className="text-xs text-slate-500">
                {participants.length} persones
              </span>
            </div>

            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {participant.name}
                  </span>
                  {participant.isHost ? (
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                      Host
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={newParticipant}
                onChange={(event) => setNewParticipant(event.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
                placeholder="Afegir participant"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                + Afegir
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Categories</p>
              <span className="text-xs text-slate-500">
                {categories.filter((category) => category.visible).length} visibles
              </span>
            </div>

            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.key}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {category.label}
                  </span>

                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={category.visible}
                      onChange={() => toggleCategory(category.key)}
                    />
                    Visible
                  </label>
                </div>
              ))}
            </div>
          </div>
        </fieldset>
      </section>

      <aside className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
          Resum
        </p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900">{sessionName}</h3>

        <dl className="mt-6 space-y-4 text-sm text-slate-600">
          <div>
            <dt className="font-medium text-slate-500">Localització</dt>
            <dd className="mt-1 text-base font-semibold text-slate-800">
              {location}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">Codi de la sessió</dt>
            <dd className="mt-1 text-2xl font-black tracking-[0.18em] text-orange-600">
              {created ? code : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Invitació
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {created && code
              ? `Comparteix el codi ${code} amb els teus companys.`
              : "Crea la sessió per generar el codi d’invitació."}
          </p>

          {created && code ? (
            <button
              type="button"
              onClick={handleContinueToVoting}
              className="mt-4 w-full rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Seguir a votar
            </button>
          ) : null}
        </div>
      </aside>
    </div></div>
  );
}
