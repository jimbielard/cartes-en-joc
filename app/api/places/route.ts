import { auth } from "@/auth";

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
  if (!(await auth())?.user?.id) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "restaurants").trim();

  if (!query) {
    return NextResponse.json({ restaurants: [] });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      {
        error: "Manca GOOGLE_PLACES_API_KEY o GOOGLE_MAPS_API_KEY a les variables d'entorn.",
        restaurants: [],
      },
      { status: 500 },
    );
  }

  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
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
          error:
            payload?.error?.message ??
            payload?.message ??
            "Google Places request failed",
          restaurants: [],
        },
        { status: 400 },
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

    return NextResponse.json({ restaurants });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Google Places request failed",
        restaurants: [],
      },
      { status: 500 },
    );
  }
}
