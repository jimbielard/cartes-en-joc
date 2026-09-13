import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizeRestaurantText } from "@/lib/restaurants";
import { toPlaceRestaurant, type PlaceRestaurant } from "@/lib/restaurants";
import { summarizeVotes } from "@/lib/restaurant-summary";

export function restaurantIdentity(name: string, area: string) {
  return createHash("sha256").update(JSON.stringify([normalizeRestaurantText(name), normalizeRestaurantText(area)])).digest("hex");
}

export async function attachSummaries(places: PlaceRestaurant[]) {
  if (!places.length) return [];
  const records = await prisma.restaurant.findMany({ where: { OR: [
    { id: { in: places.filter(p => p.id.startsWith("local-")).map(p => p.id.slice(6)) } },
    { googlePlaceId: { in: places.map(p => p.id) } },
    { identityKey: { in: places.map(p => restaurantIdentity(p.name, p.area)) } },
  ] }, include: { votes: { select: { categoryScores: true } } } });
  const found = new Map<string, PlaceRestaurant>();
  for (const place of places) {
    const record = records.find(r => `local-${r.id}` === place.id || r.googlePlaceId === place.id || r.identityKey === restaurantIdentity(place.name, place.area));
    const result = record ? { ...place, ...toPlaceRestaurant(record), summary: summarizeVotes(record.votes) } : { ...place, summary: summarizeVotes([]) };
    found.set(result.id, result);
  }
  return [...found.values()];
}

export async function resolveRestaurant(input: unknown, userId: string | null) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Escull un restaurant.");
  const item = input as Record<string, unknown>;
  if (typeof item.id === "string" && item.id.startsWith("local-")) {
    const found = await prisma.restaurant.findUnique({ where: { id: item.id.slice(6) } });
    if (!found) throw new Error("No s’ha trobat el restaurant.");
    return found;
  }
  if (typeof item.name !== "string" || typeof item.area !== "string" || !item.name.trim() || !item.area.trim() || item.name.length > 120 || item.area.length > 200) throw new Error("Cal indicar un nom i una ubicació vàlids.");
  const name = item.name.trim();
  const area = item.area.trim();
  const cuisine = typeof item.type === "string" ? item.type.trim().slice(0, 80) : "Restaurant";
  const googlePlaceId = typeof item.id === "string" && /^[A-Za-z0-9_-]{10,200}$/.test(item.id) ? item.id : null;
  if (googlePlaceId) {
    const found = await prisma.restaurant.findUnique({ where: { googlePlaceId } });
    if (found) return found;
  }
  return prisma.restaurant.upsert({ where: { identityKey: restaurantIdentity(name, area) }, update: googlePlaceId ? { googlePlaceId } : {}, create: { name, area, cuisine, identityKey: restaurantIdentity(name, area), searchText: normalizeRestaurantText(`${name} ${area} ${cuisine}`), createdById: userId, googlePlaceId } });
}
