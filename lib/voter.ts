import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function getVoter(create = true) {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id, key: `user:${session.user.id}`, name: session.user.name ?? "Usuari" };
  const jar = await cookies();
  let token = jar.get("cej-guest")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) return null;
    token = randomBytes(32).toString("hex");
    jar.set("cej-guest", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && !!process.env.VERCEL, path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return { userId: null, key: `guest:${createHash("sha256").update(token).digest("hex")}`, name: "Convidat" };
}
