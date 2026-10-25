export function lireLienExterne(adresse: unknown): string | null {
  if (typeof adresse !== "string") return null;
  const propre = adresse.trim();
  try {
    const lien = new URL(propre);
    return lien.protocol === "https:" || lien.protocol === "http:" ? propre : null;
  } catch {
    return null;
  }
}
