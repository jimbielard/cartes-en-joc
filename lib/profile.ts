export function parseProfile(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const values = input as Record<string, unknown>;
  if (typeof values.name !== "string" || typeof values.alias !== "string" || typeof values.bio !== "string") return null;
  const name = values.name.trim();
  const alias = values.alias.trim();
  const bio = values.bio.trim();
  if (!name || name.length > 80 || alias.length > 40 || bio.length > 500) return null;
  return { name, alias: alias || null, bio: bio || null };
}
