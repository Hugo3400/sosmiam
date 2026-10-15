const ONGLETS_PRINCIPAUX: ReadonlySet<string> = new Set(["/", "/explorer", "/scan", "/potes", "/profil"]);

export function estSurOngletsPrincipaux(chemin: string | null): boolean {
  return chemin !== null && ONGLETS_PRINCIPAUX.has(chemin);
}
