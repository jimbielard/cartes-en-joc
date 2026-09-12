"use client";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { DEFAULT_VOTE_CATEGORIES, type VoteCategory } from "@/lib/vote-categories";

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

const fallbackRestaurants: PlaceRestaurant[] = [
  {
    id: "fallback-1",
    name: "La Cova del Taverner",
    area: "Eixample, Barcelona",
    rating: 8.7,
    type: "Catalana",
    price: "€€",
    description: "Menjars casolans i ambient molt acollidor.",
    keywords: ["cova", "taverner", "catalana", "eixample"],
  },
  {
    id: "fallback-2",
    name: "Bistrot del Port",
    area: "Barceloneta, Barcelona",
    rating: 8.3,
    type: "Marisc",
    price: "€€€",
    description: "Vistes al mar i plats de temporada.",
    keywords: ["bistrot", "port", "marisc", "barceloneta"],
  },
  {
    id: "fallback-3",
    name: "Terrassa Verde",
    area: "Gràcia, Barcelona",
    rating: 8.9,
    type: "Vegetarià",
    price: "€€",
    description: "Opcions fresques i molt ben presentades.",
    keywords: ["terrassa", "verde", "vegetaria", "gracia"],
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function clampScore(value: number | string) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(10, Math.max(0, numeric));
}

export function RestaurantPicker({ code }: { code?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(fallbackRestaurants[1]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<VoteCategory[]>(DEFAULT_VOTE_CATEGORIES);
  const [overallRating, setOverallRating] = useState(8.5);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [restaurants, setRestaurants] = useState<PlaceRestaurant[]>(fallbackRestaurants);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

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

        const nextRestaurants = Array.isArray(payload?.restaurants) && payload.restaurants.length
          ? payload.restaurants
          : fallbackRestaurants.filter((restaurant) => {
              const haystack = [restaurant.name, restaurant.area, restaurant.type, ...restaurant.keywords]
                .join(" ")
                .toLowerCase();

              return haystack.includes(normalizeText(queryValue));
            });

        setRestaurants(nextRestaurants);
      } catch {
        if (controller.signal.aborted) return;
        setRestaurants(
          fallbackRestaurants.filter((restaurant) => {
            const haystack = [restaurant.name, restaurant.area, restaurant.type, ...restaurant.keywords]
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizeText(queryValue));
          }),
        );
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
        setCategoryScores(
          Object.fromEntries(
            visible.map((category) => [category.key, Number(category.key === "qualitat" ? 8 : 7)]),
          ),
        );
      } catch {
        setCategories(DEFAULT_VOTE_CATEGORIES);
      }
    };

    loadSession();
  }, [code]);

  const filteredRestaurants = query.trim() ? restaurants : fallbackRestaurants;

  const selectedRestaurant =
    filteredRestaurants.find((restaurant) => restaurant.id === selectedId) ??
    filteredRestaurants[0];

  const visibleCategories = categories.filter((category) => category.visible);

  const updateCategoryScore = (key: string, value: string) => {
    const score = clampScore(value);
    setCategoryScores((current) => ({ ...current, [key]: score }));
  };

  const handleVote = async () => {
    if (!selectedRestaurant) return;
    if (!code) {
      setError("Falta el codi de la sessió.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const finalRating = clampScore(overallRating);
      const categoryPayload = Object.fromEntries(
        visibleCategories.map((category) => [category.key, categoryScores[category.key] ?? finalRating]),
      );

      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          restaurantName: selectedRestaurant.name,
          restaurantArea: selectedRestaurant.area,
          restaurantType: selectedRestaurant.type,
          rating: finalRating,
          categoryScores: categoryPayload,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "No s’ha pogut guardar el vot");
      }

      setSuccess("Vot guardat correctament.");
      router.push(`/results?code=${encodeURIComponent(code)}`);
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
                <dt className="font-medium text-slate-500">Valoració global</dt>
                <dd className="mt-1 text-base font-semibold text-slate-800">
                  {selectedRestaurant.rating.toFixed(1)} / 10
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl border border-orange-200 bg-white p-3">
              <label className="block text-sm font-medium text-slate-700">
                Puntuar restaurant (0–10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={overallRating}
                onChange={(event) => setOverallRating(clampScore(event.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-orange-400"
              />
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Categories visibles</p>

              {visibleCategories.length ? (
                visibleCategories.map((category) => (
                  <div key={category.key} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">
                        {category.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {categoryScores[category.key] ?? overallRating.toFixed(1)}/10
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={categoryScores[category.key] ?? overallRating}
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
              {saving ? "Guardant vot..." : "Guardar vot"}
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
