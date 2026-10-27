export function lireCibleSignalementActus(parametres: URLSearchParams): { lieuId: number | null } | null {
  const lieu = parametres.get("lieu");
  if (lieu === null) return { lieuId: null };
  return /^-?\d{1,9}$/.test(lieu) ? { lieuId: Number(lieu) } : null;
}
