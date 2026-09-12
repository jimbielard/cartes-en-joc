export type VoteCategory = {
  key: string;
  label: string;
  visible: boolean;
};

export function averageCategoryScores(input: unknown): number | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const scores = Object.values(input).filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10);
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
}

export const DEFAULT_VOTE_CATEGORIES: VoteCategory[] = [
  { key: "espai", label: "ESPAI", visible: true },
  { key: "neteja", label: "NETEJA", visible: true },
  { key: "entorn", label: "ENTORN", visible: true },
  { key: "menjar", label: "MENJAR", visible: true },
  { key: "plat_estrella", label: "PLAT ESTRELLA", visible: true },
  { key: "servei", label: "SERVEI", visible: true },
  { key: "postres", label: "POSTRES", visible: true },
  { key: "preu", label: "PREU", visible: true },
];

export function normalizeCategories(input: unknown): VoteCategory[] {
  const fallback = DEFAULT_VOTE_CATEGORIES.map((item) => ({ ...item }));

  if (!Array.isArray(input) || input.length === 0) {
    return fallback;
  }

  return fallback.map((defaultItem) => {
    const found = input.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Record<string, unknown>;
      return String(candidate.key ?? "") === defaultItem.key;
    });

    if (!found || typeof found !== "object") {
      return { ...defaultItem };
    }

    const candidate = found as Record<string, unknown>;
    const key = String(candidate.key ?? defaultItem.key);
    const label = defaultItem.label;
    const visible = candidate.visible === undefined ? defaultItem.visible : Boolean(candidate.visible);

    return {
      key,
      label,
      visible,
    };
  });
}

export function buildCategoryScores(categories: VoteCategory[], values: Record<string, number | string | null | undefined>) {
  return Object.fromEntries(
    categories
      .filter((category) => category.visible)
      .map((category) => {
        const raw = values[category.key];
        const numeric = raw === null || raw === undefined || raw === "" ? NaN : Number(raw);

        return [category.key, Number.isFinite(numeric) ? Math.min(10, Math.max(0, numeric)) : null];
      }),
  );
}
