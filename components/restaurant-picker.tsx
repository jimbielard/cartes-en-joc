"use client";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { DEFAULT_VOTE_CATEGORIES, averageCategoryScores, buildCategoryScores, type VoteCategory } from "@/lib/vote-categories";

type PlaceRestaurant = {
  id: string;
  name: string;
  area: string;
  rating: number;
  type: string;
  price: string;
  description: string;
  keywords: string[];
};

const fallbackRestaurants: PlaceRestaurant[] = [];

function clampScore(value: number | string) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(10, Math.max(0, numeric));
}

export function RestaurantPicker({ code, initialQuery = "" }: { code?: string; initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeCode, setActiveCode] = useState(code);
  const [selectedId, setSelectedId] = useState<string | null>(fallbackRestaurants[1]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<VoteCategory[]>(DEFAULT_VOTE_CATEGORIES);
  const [categoryScores, setCategoryScores] = useState<Record<string, number | string>>({});
  const [restaurants, setRestaurants] = useState<PlaceRestaurant[]>(fallbackRestaurants);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [resultQuery, setResultQuery] = useState("");
  const [placesError, setPlacesError] = useState("");

  useEffect(() => {
    const queryValue = query.trim();

    if (!queryValue) {
      return;
    }

    const controller = new AbortController();

    const loadPlaces = async () => {
      setLoadingPlaces(true);

      try {
        const response = await fetch(`/api/places?query=${encodeURIComponent(queryValue)}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "No s’han pogut carregar restaurants");
        }

        setRestaurants(Array.isArray(payload?.restaurants) ? payload.restaurants : []);
        setResultQuery(queryValue);
        setPlacesError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setRestaurants([]);
        setResultQuery(queryValue);
        setPlacesError(err instanceof Error ? err.message : "No s'han pogut carregar els restaurants.");
      } finally {
        if (!controller.signal.aborted) setLoadingPlaces(false);
      }
    };

    const timer = setTimeout(loadPlaces, 300);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    if (!code) return;

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${encodeURIComponent(code)}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "No s’ha pogut carregar la sessió");
        }

        const nextCategories: VoteCategory[] = Array.isArray(payload?.categories)
          ? payload.categories
          : DEFAULT_VOTE_CATEGORIES;

        setCategories(nextCategories);
        const visible = nextCategories.filter((category: VoteCategory) => category.visible);
        setCategoryScores(Object.fromEntries(visible.map(category => [category.key, ""])));
      } catch {
        setCategories(DEFAULT_VOTE_CATEGORIES);
      }
    };

    loadSession();
  }, [code]);

  const filteredRestaurants = query.trim() && resultQuery === query.trim() ? restaurants : fallbackRestaurants;

  const selectedRestaurant =
    filteredRestaurants.find((restaurant) => restaurant.id === selectedId) ??
    filteredRestaurants[0];

  const visibleCategories = categories.filter((category) => category.visible);
  const categoryPayload = buildCategoryScores(categories, categoryScores);
  const overallRating = averageCategoryScores(categoryPayload);

  const updateCategoryScore = (key: string, value: string) => {
    const score = value === "" ? "" : clampScore(value);
    setCategoryScores((current) => ({ ...current, [key]: score }));
  };

  const handleVote = async () => {
    if (!selectedRestaurant) return;
    if (overallRating === null) { setError("Puntua almenys una categoria per votar."); return; }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let voteCode = activeCode;
      if (!voteCode) {
        const created = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: selectedRestaurant.name, location: selectedRestaurant.area, categories }),
        });
        const payload = await created.json();
        if (!created.ok) throw new Error(payload.error ?? "No s’ha pogut crear la sessió.");
        voteCode = String(payload.code);
        setActiveCode(voteCode);
      }

      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voteCode,
          restaurantName: selectedRestaurant.name,
          restaurantArea: selectedRestaurant.area,
          restaurantType: selectedRestaurant.type,
          categoryScores: categoryPayload,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "No s’ha pogut guardar el vot");
      }

      setSuccess("Vot guardat correctament.");
      router.push(`/results?code=${encodeURIComponent(voteCode)}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No s’ha pogut guardar el vot",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
              Cercar restaurant
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Tria un lloc per votar
            </h2>
          </div>

          <div className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            {loadingPlaces ? "Cercant..." : `${filteredRestaurants.length} resultats`}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Cerca per nom, barri o tipus
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
            placeholder="Pasta, barceloneta, mediterrània..."
          />
        </label>

        <div className="mt-5 space-y-3">
          {placesError && query.trim() && <p role="alert" className="text-sm text-red-700">{placesError}</p>}
          {!loadingPlaces && filteredRestaurants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No s’han trobat restaurants per aquesta cerca.
            </div>
          ) : null}

          {filteredRestaurants.map((restaurant) => {
            const isSelected = selectedRestaurant?.id === restaurant.id;

            return (
              <button
                key={restaurant.id}
                type="button"
                onClick={() => setSelectedId(restaurant.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-orange-300 bg-orange-50 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {restaurant.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {restaurant.area} · {restaurant.type}
                    </p>
                  </div>

                  <div className="rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-amber-600 shadow-sm">
                    ★ {restaurant.rating.toFixed(1)}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600">{restaurant.description}</p>

                <div className="mt-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  <span>{restaurant.price}</span>
                  <span>{isSelected ? "Seleccionat" : "Votar"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-500">
          Restaurant escollit
        </p>

        {selectedRestaurant ? (
          <>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              {selectedRestaurant.name}
            </h3>

            <dl className="mt-5 space-y-4 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-500">Barri</dt>
                <dd className="mt-1 text-base font-semibold text-slate-800">
                  {selectedRestaurant.area}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Tipus</dt>
                <dd className="mt-1 text-base font-semibold text-slate-800">
                  {selectedRestaurant.type}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Valoració de Google</dt>
                <dd className="mt-1 text-base font-semibold text-slate-800">
                  {selectedRestaurant.rating.toFixed(1)} / 10
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl border border-orange-200 bg-white p-3">
              <p className="text-sm font-medium text-slate-700">La teva puntuació</p>
              <output aria-live="polite" className="mt-2 block text-2xl font-bold text-orange-700">{overallRating === null ? "Encara sense nota" : `${overallRating.toFixed(1)} / 10`}</output>
              <p className="mt-2 text-xs text-slate-500">Mitjana de les categories que has puntuat. Les categories buides no compten.</p>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Categories visibles</p>

              {visibleCategories.length ? (
                visibleCategories.map((category) => (
                  <div key={category.key} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label htmlFor={`score-${category.key}`} className="text-sm font-medium text-slate-700">
                        {category.label}
                      </label>
                      <span className="text-xs text-slate-500">
                        {categoryScores[category.key] === "" || categoryScores[category.key] === undefined ? "Sense puntuar" : `${categoryScores[category.key]}/10`}
                      </span>
                    </div>
                    <input
                      id={`score-${category.key}`}
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={categoryScores[category.key] ?? ""}
                      onChange={(event) =>
                        updateCategoryScore(category.key, event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-orange-400"
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">
                  No hi ha categories visibles en aquesta sessió.
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleVote}
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Guardant…" : activeCode ? "Guardar vot" : "Crear sessió i votar"}
            </button>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No hi ha restaurants que coincideixin amb la cerca.
          </p>
        )}
      </aside>
    </div>
  );
}
