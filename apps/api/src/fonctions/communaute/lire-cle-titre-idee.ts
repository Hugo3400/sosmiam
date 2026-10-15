const LONGUEUR_MAX = 120;

export function lireCleTitreIdee(titre: string): string {
  return titre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}\p{N}€]+/gu, " ")
    .trim()
    .slice(0, LONGUEUR_MAX);
}
