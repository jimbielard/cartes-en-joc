import { prisma } from "@/lib/prisma";
import { averageCategoryScores, DEFAULT_VOTE_CATEGORIES } from "@/lib/vote-categories";

export type RestaurantSummary = { totalVotes: number; average: number | null; categories: Array<{ key: string; label: string; average: number | null; votes: number }> };

export function summarizeVotes(votes: Array<{ categoryScores: unknown }>): RestaurantSummary {
  const ratings = votes.map(v => averageCategoryScores(v.categoryScores)).filter((v): v is number => v !== null);
  const categories = DEFAULT_VOTE_CATEGORIES.map(category => {
    const values = votes.flatMap(vote => {
      const scores = vote.categoryScores;
      if (!scores || typeof scores !== "object" || Array.isArray(scores)) return [];
      const value = (scores as Record<string, unknown>)[category.key];
      return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10 ? [value] : [];
    });
    return { key: category.key, label: category.label, average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, votes: values.length };
  });
  return { totalVotes: votes.length, average: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null, categories };
}

export async function getRestaurantSummary(id: string) {
  return summarizeVotes(await prisma.vote.findMany({ where: { restaurantId: id }, select: { categoryScores: true } }));
}
