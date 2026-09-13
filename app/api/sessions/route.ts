import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_VOTE_CATEGORIES, normalizeCategories } from "@/lib/vote-categories";
import { NextResponse } from "next/server";
import { resolveRestaurant } from "@/lib/restaurant-store";
import { randomBytes } from "node:crypto";

function generateSessionCode() {
  return `JDC-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const name = String(body?.name ?? "Sessió de restaurants").trim();
  const location = String(body?.location ?? "").trim();
  const participants = Array.isArray(body?.participants)
    ? body.participants.map((participant: unknown) => String(participant ?? "").trim()).filter(Boolean)
    : [];
  const categories = normalizeCategories(body?.categories ?? DEFAULT_VOTE_CATEGORIES);

  if (!name) {
    return NextResponse.json({ error: "Missing session name" }, { status: 400 });
  }

  if (!categories.some(category => category.visible)) return NextResponse.json({ error: "Activa almenys una categoria." }, { status: 400 });
  let restaurant;
  try { restaurant = await resolveRestaurant(body.restaurant, session.user.id); }
  catch { return NextResponse.json({ error: "Escull el restaurant de la sessió abans de crear-la." }, { status: 400 }); }

  let code = generateSessionCode();
  let existing = await prisma.restaurantSession.findUnique({ where: { code } });

  while (existing) {
    code = generateSessionCode();
    existing = await prisma.restaurantSession.findUnique({ where: { code } });
  }

  const created = await prisma.restaurantSession.create({
    data: {
      code,
      name: name.trim(),
      location: location || null,
      categories,
      hostId: session.user.id,
      restaurantId: restaurant.id,
      participants: {
        create: [
          { name: session.user.name ?? "Tu", userId: session.user.id, voterKey: `user:${session.user.id}` },
          ...participants.map((participantName: string) => ({ name: participantName })),
        ],
      },
    },
  });

  return NextResponse.json({
    id: created.id,
    code: created.code,
    name: created.name,
    location: created.location,
    categories: created.categories ?? DEFAULT_VOTE_CATEGORIES,
  });
}
