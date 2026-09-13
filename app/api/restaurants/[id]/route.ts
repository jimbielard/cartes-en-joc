import { prisma } from "@/lib/prisma";
import { toPlaceRestaurant } from "@/lib/restaurants";
import { getRestaurantSummary } from "@/lib/restaurant-summary";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: id.replace(/^local-/, "") } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant no trobat." }, { status: 404 });
  return NextResponse.json({ restaurant: { ...toPlaceRestaurant(restaurant), summary: await getRestaurantSummary(restaurant.id) } });
}
