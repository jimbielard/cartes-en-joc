import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseProfile } from "@/lib/profile";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Cal iniciar sessió." }, { status: 401 });
  const profile = parseProfile(await request.json().catch(() => null));
  if (!profile) return NextResponse.json({ error: "Revisa el nom (màxim 80 caràcters), l’àlies (40) i la biografia (500)." }, { status: 400 });
  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: session.user.id }, data: profile }),
      prisma.participant.updateMany({ where: { userId: session.user.id }, data: { name: profile.name } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No s’han pogut desar les dades. Torna-ho a provar." }, { status: 500 });
  }
}
