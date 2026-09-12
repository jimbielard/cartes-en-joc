import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_VOTE_CATEGORIES,
  buildCategoryScores,
  normalizeCategories,
} from "@/lib/vote-categories";
import { NextResponse } from "next/server";

function clampScore(value: number | string | null | undefined) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.min(10, Math.max(0, numeric));
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
  const code = String(body?.code ?? "").trim().toUpperCase();
  const restaurantName = String(body?.restaurantName ?? "").trim();
  const restaurantArea = String(body?.restaurantArea ?? "").trim();
  const restaurantType = String(body?.restaurantType ?? "").trim();
  const rating = clampScore(body?.rating ?? 0);

  if (!code || !restaurantName) {
    return NextResponse.json({ error: "Missing required vote fields" }, { status: 400 });
  }

  const restaurantSession = await prisma.restaurantSession.findUnique({
    where: { code },
    include: { participants: true },
  });

  if (!restaurantSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const sessionCategories = normalizeCategories(
    restaurantSession.categories ?? DEFAULT_VOTE_CATEGORIES,
  );
  const categoryScores = buildCategoryScores(
    sessionCategories,
    (body?.categoryScores && typeof body.categoryScores === "object")
      ? body.categoryScores
      : {},
  );

  const [, vote] = await prisma.$transaction([
    prisma.participant.upsert({
      where: { sessionId_userId: { sessionId: restaurantSession.id, userId: session.user.id } },
      create: { sessionId: restaurantSession.id, userId: session.user.id, name: session.user.name ?? "Usuari" },
      update: {},
    }),
    prisma.vote.upsert({
    where: {
      sessionId_userId: {
        sessionId: restaurantSession.id,
        userId: session.user.id,
      },
    },
    update: {
      restaurantName,
      restaurantArea: restaurantArea || null,
      restaurantType: restaurantType || null,
      rating: rating ?? null,
      categoryScores: Object.keys(categoryScores).length ? categoryScores : undefined,
    },
    create: {
      sessionId: restaurantSession.id,
      userId: session.user.id,
      restaurantName,
      restaurantArea: restaurantArea || null,
      restaurantType: restaurantType || null,
      rating: rating ?? null,
      categoryScores: Object.keys(categoryScores).length ? categoryScores : undefined,
    },
    }),
  ]);

  return NextResponse.json({ ok: true, vote });
}
