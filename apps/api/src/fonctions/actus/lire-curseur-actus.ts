export function lireCurseurActus(brut: unknown): { publieLe: Date; id: number } | null {
  if (typeof brut !== "string" || !/^\d{1,15}\.\d{1,9}$/.test(brut)) return null;
  const [temps, id] = brut.split(".").map(Number) as [number, number];
  return id > 0 ? { publieLe: new Date(temps), id } : null;
}
