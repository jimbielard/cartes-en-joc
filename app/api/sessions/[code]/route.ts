import { prisma } from "@/lib/prisma";
import { normalizeCategories, averageCategoryScores } from "@/lib/vote-categories";
import { getVoter } from "@/lib/voter";
import { toPlaceRestaurant } from "@/lib/restaurants";
import { getRestaurantSummary } from "@/lib/restaurant-summary";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const target = await prisma.restaurantSession.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!target) return NextResponse.json({ error: "Sessió no trobada." }, { status: 404 });
  const voter = (await getVoter())!;
  await prisma.participant.upsert({ where: { sessionId_voterKey: { sessionId: target.id, voterKey: voter.key } }, create: { sessionId: target.id, userId: voter.userId, voterKey: voter.key, name: voter.name }, update: {} });
  return NextResponse.json({ code: target.code });
}

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const target = await prisma.restaurantSession.findUnique({ where: { code: code.trim().toUpperCase() }, include: { restaurant: true, participants: true, votes: { include: { user: { select: { name: true } } } } } });
  if (!target) return NextResponse.json({ error: "Sessió no trobada." }, { status: 404 });
  return NextResponse.json({
    code: target.code, name: target.name, location: target.location, categories: normalizeCategories(target.categories),
    restaurant: target.restaurant ? { ...toPlaceRestaurant(target.restaurant), summary: await getRestaurantSummary(target.restaurant.id) } : null,
    participants: target.participants.map(p => ({ id: p.id, name: p.name, userId: p.userId ?? p.voterKey })),
    votes: target.votes.map(v => ({ id: v.id, restaurantName: v.restaurantName, restaurantArea: v.restaurantArea, restaurantType: v.restaurantType, rating: averageCategoryScores(v.categoryScores), categoryScores: v.categoryScores, user: { id: v.userId ?? v.voterKey, name: v.user?.name ?? "Convidat" } })),
  });
}
