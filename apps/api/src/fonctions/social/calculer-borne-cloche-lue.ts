export function calculerBorneClocheLue(o: { aProfil: boolean; vuesLe: Date | null; jusqua: Date | null; maintenant: Date }): Date | null {
  const lue = o.aProfil ? o.vuesLe : o.jusqua;
  if (!lue) return null;
  return new Date(Math.min(lue.getTime(), o.maintenant.getTime(), o.jusqua?.getTime() ?? Number.POSITIVE_INFINITY));
}
