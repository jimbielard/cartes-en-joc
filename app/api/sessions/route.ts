import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_VOTE_CATEGORIES, normalizeCategories } from "@/lib/vote-categories";
import { NextResponse } from "next/server";

function generateSessionCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";

  const randomPart = Array.from({ length: 4 }, () => {
    const source = Math.random() > 0.5 ? letters : digits;
    return source[Math.floor(Math.random() * source.length)];
  }).join("");

  return `JDC-${randomPart}`;
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
      participants: {
        create: [
          { name: session.user.name ?? "Tu", userId: session.user.id },
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
