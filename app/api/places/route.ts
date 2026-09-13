import { attachSummaries } from "@/lib/restaurant-store";
import { prisma } from "@/lib/prisma";
import { normalizeRestaurantText, toPlaceRestaurant } from "@/lib/restaurants";

type GooglePlace = { id?: string; displayName?: { text?: string }; formattedAddress?: string; types?: string[]; rating?: number; priceLevel?: string };

import { NextResponse } from "next/server";

const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";

function normalizeRestaurantType(type: string) {
  const cleaned = type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/ Restaurant$/i, "")
    .trim();

  return cleaned || "Restaurant";
}

function normalizePriceLevel(level?: string) {
  const priceMap: Record<string, string> = {
    PRICE_LEVEL_INEXPENSIVE: "€",
    PRICE_LEVEL_MODERATE: "€€",
    PRICE_LEVEL_EXPENSIVE: "€€€",
    PRICE_LEVEL_VERY_EXPENSIVE: "€€€€",
  };

  return priceMap[level ?? ""] ?? "€€";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "restaurants").trim().slice(0, 200);

  if (!query) {
    return NextResponse.json({ restaurants: [] });
  }

  const localRestaurants = await attachSummaries((await prisma.restaurant.findMany({
    where: { AND: normalizeRestaurantText(query).split(" ").filter(Boolean).map(word => ({ searchText: { contains: word } })) },
    orderBy: { createdAt: "desc" }, take: 20,
  })).map(toPlaceRestaurant));

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      {
        warning: "La cerca de Google no està disponible. Pots consultar els restaurants de la comunitat o crear-ne un.",
        restaurants: localRestaurants,
      },
      { status: 200 },
    );
  }

  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.types,places.rating,places.priceLevel",
      },
      body: JSON.stringify({
        textQuery: `${query} restaurant`,
        pageSize: 8,
        languageCode: "es",
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          warning: "No s’ha pogut consultar Google. Pots consultar els restaurants de la comunitat o crear-ne un.",
          restaurants: localRestaurants,
        },
        { status: 200 },
      );
    }

    const filteredPlaces = (payload?.places ?? []).filter((place: GooglePlace) => {
      const types = Array.isArray(place?.types) ? place.types : [];
      const hasRestaurantSignal =
        types.includes("restaurant") ||
        types.some((type: string) => type.includes("_restaurant")) ||
        types.some((type: string) => type.includes("food"));

      return hasRestaurantSignal;
    });

    const restaurants = filteredPlaces.map((place: GooglePlace, index: number) => {
      const types = Array.isArray(place?.types) ? place.types : [];
      const displayName = place?.displayName?.text ?? place?.displayName ?? "Restaurant";
      const formattedAddress = place?.formattedAddress ?? "Barcelona";
      const primaryType =
        types.find(
          (type: string) =>
            type !== "point_of_interest" &&
            type !== "establishment" &&
            type !== "food" &&
            type !== "restaurant" &&
            type !== "bar" &&
            type !== "cafe",
        ) ?? "restaurant";

      return {
        id: String(place?.id ?? `${displayName}-${index}`),
        name: String(displayName),
        area: String(formattedAddress),
        rating: place?.rating ? Math.min(Number(place.rating) * 2, 10) : 0,
        type: normalizeRestaurantType(primaryType),
        price: normalizePriceLevel(place?.priceLevel),
        description: formattedAddress,
        keywords: [
          String(displayName),
          String(formattedAddress),
          ...types.filter(
            (type: string) =>
              type !== "point_of_interest" && type !== "establishment" && type !== "food",
          ),
        ],
      };
    });

    return NextResponse.json({ restaurants: await attachSummaries([...localRestaurants, ...restaurants]) });
  } catch {
    return NextResponse.json(
      {
        warning: "No s’ha pogut consultar Google. Pots consultar els restaurants de la comunitat o crear-ne un.",
        restaurants: localRestaurants,
      },
      { status: 200 },
    );
  }
}
