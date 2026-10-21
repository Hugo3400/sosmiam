const FORME = /^\d{1,6}(?:\.\d{1,6}){0,2}$/;

export function lirePartiesVersion(version: unknown): [number, number, number] | null {
  if (typeof version !== "string") return null;
  const propre = version.trim();
  if (!FORME.test(propre)) return null;
  const [majeure = 0, mineure = 0, correctif = 0] = propre.split(".").map(Number);
  return [majeure, mineure, correctif];
}
