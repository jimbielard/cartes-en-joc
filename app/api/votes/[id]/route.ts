import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Cal iniciar sessió." }, { status: 401 });
  const { id } = await params;
  try {
    const deleted = await prisma.vote.deleteMany({ where: { id, userId: session.user.id } });
    if (!deleted.count) return NextResponse.json({ error: "No s’ha trobat aquesta valoració al teu historial." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No s’ha pogut eliminar la valoració. Torna-ho a provar." }, { status: 500 });
  }
}
