const LONGUEUR_MAX = 80;

export function normaliserVilleCle(ville: string | null | undefined): string | null {
  if (typeof ville !== "string") return null;
  const cle = ville
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .slice(0, LONGUEUR_MAX)
    .trim();
  return cle === "" ? null : cle;
}
