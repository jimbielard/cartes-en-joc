import { prisma } from "@/lib/prisma";
import { buildCategoryScores, averageCategoryScores, normalizeCategories } from "@/lib/vote-categories";
import { getVoter } from "@/lib/voter";
import { resolveRestaurant } from "@/lib/restaurant-store";
import { getRestaurantSummary } from "@/lib/restaurant-summary";
import { toPlaceRestaurant } from "@/lib/restaurants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const target = code ? await prisma.restaurantSession.findUnique({ where: { code }, include: { restaurant: true } }) : null;
  if (code && !target) return NextResponse.json({ error: "Sessió no trobada." }, { status: 404 });
  if (target && !target.restaurant) return NextResponse.json({ error: "Aquesta sessió antiga no té un restaurant escollit. Crea una sessió nova." }, { status: 409 });
  const categories = normalizeCategories(target?.categories);
  const rawScores = body.categoryScores;
  if (!rawScores || typeof rawScores !== "object" || Array.isArray(rawScores)) return NextResponse.json({ error: "Puntua almenys una categoria sobre 10." }, { status: 400 });
  for (const category of categories.filter(c => c.visible)) {
    const value = rawScores[category.key];
    if (value !== undefined && value !== null && value !== "" && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10)) return NextResponse.json({ error: "Les puntuacions han de ser números entre 0 i 10." }, { status: 400 });
  }
  const categoryScores = buildCategoryScores(categories, rawScores);
  const rating = averageCategoryScores(categoryScores);
  if (rating === null) return NextResponse.json({ error: "Puntua almenys una categoria sobre 10." }, { status: 400 });
  const voter = (await getVoter())!;
  let restaurant;
  try { restaurant = target?.restaurant ?? await resolveRestaurant(body.restaurant, voter.userId); }
  catch { return NextResponse.json({ error: "Escull un restaurant vàlid." }, { status: 400 }); }
  const contextKey = target?.id ?? "direct";
  const data = { restaurantName: restaurant.name, restaurantArea: restaurant.area, restaurantType: restaurant.cuisine, rating, categoryScores };
  const vote = await prisma.$transaction(async tx => {
    if (target) await tx.participant.upsert({ where: { sessionId_voterKey: { sessionId: target.id, voterKey: voter.key } }, create: { sessionId: target.id, userId: voter.userId, voterKey: voter.key, name: voter.name }, update: {} });
    return tx.vote.upsert({
      where: { restaurantId_voterKey_contextKey: { restaurantId: restaurant.id, voterKey: voter.key, contextKey } },
      update: data,
      create: { ...data, restaurantId: restaurant.id, userId: voter.userId, voterKey: voter.key, contextKey, sessionId: target?.id ?? null },
    });
  });
  return NextResponse.json({ ok: true, vote: { id: vote.id, rating: vote.rating }, restaurant: { ...toPlaceRestaurant(restaurant), summary: await getRestaurantSummary(restaurant.id) } });
}
