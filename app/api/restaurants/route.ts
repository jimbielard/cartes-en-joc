import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeRestaurantText, toPlaceRestaurant } from "@/lib/restaurants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.area !== "string" || typeof body.cuisine !== "string") {
    return NextResponse.json({ error: "Introdueix el nom, la ubicació i el tipus de cuina." }, { status: 400 });
  }
  const name = body.name.trim();
  const area = body.area.trim();
  const cuisine = body.cuisine.trim();
  if (!name || name.length > 120 || !area || area.length > 200 || !cuisine || cuisine.length > 80) {
    return NextResponse.json({ error: "Revisa el nom (120 caràcters), la ubicació (200) i el tipus de cuina (80)." }, { status: 400 });
  }
  const identityKey = createHash("sha256").update(JSON.stringify([normalizeRestaurantText(name), normalizeRestaurantText(area)])).digest("hex");
  try {
    const restaurant = await prisma.restaurant.upsert({
      where: { identityKey }, update: {},
      create: { name, area, cuisine, identityKey, searchText: normalizeRestaurantText(`${name} ${area} ${cuisine}`), createdById: session?.user?.id ?? null },
    });
    return NextResponse.json({ restaurant: toPlaceRestaurant(restaurant) });
  } catch {
    return NextResponse.json({ error: "No s’ha pogut desar el restaurant. Torna-ho a provar." }, { status: 500 });
  }
}
