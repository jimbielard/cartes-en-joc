import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_VOTE_CATEGORIES, normalizeCategories } from "@/lib/vote-categories";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }
  const { code } = await params;
  const target = await prisma.restaurantSession.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!target) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  await prisma.participant.upsert({
    where: { sessionId_userId: { sessionId: target.id, userId: session.user.id } },
    create: { sessionId: target.id, userId: session.user.id, name: session.user.name ?? "Usuari" },
    update: {},
  });
  return NextResponse.json({ code: target.code });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No auth" }, { status: 401 });
  }

  const { code } = await params;
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!normalizedCode) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const restaurantSession = await prisma.restaurantSession.findUnique({
    where: { code: normalizedCode },
    include: {
      participants: true,
      votes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!restaurantSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: restaurantSession.id,
    code: restaurantSession.code,
    name: restaurantSession.name,
    location: restaurantSession.location,
    categories: normalizeCategories(restaurantSession.categories ?? DEFAULT_VOTE_CATEGORIES),
    host: restaurantSession.host,
    participants: restaurantSession.participants,
    votes: restaurantSession.votes.map((vote) => ({
      ...vote,
      rating: vote.rating ?? null,
      categoryScores: vote.categoryScores ?? {},
    })),
  });
}
