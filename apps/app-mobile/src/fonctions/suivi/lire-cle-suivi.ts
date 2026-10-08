/** Ce qu'une clé de suivi désigne : un lieu (par son numéro), un créateur (par son pseudo, sans « @ ») ou une personne (par son identifiant). */
export type CibleSuivi = { type: "lieu"; id: number } | { type: "createur"; pseudo: string } | { type: "personne"; id: string };

/**
 * L'inverse de calculerCleSuivi et d'ecrireCleSuivi : « lieu:12 » → { type: "lieu", id: 12 }, « createur:lea.mange » → { type: "createur", pseudo: "lea.mange" },
 * « personne:sofia » → { type: "personne", id: "sofia" }. Rend null pour une clé abîmée ou inconnue (type inconnu, numéro qui n'en est pas un, pseudo ou identifiant vide) : on l'ignore plutôt que de planter.
 */
export function lireCleSuivi(cle: string): CibleSuivi | null {
  const separateur = cle.indexOf(":");
  if (separateur < 0) return null;
  const type = cle.slice(0, separateur);
  const valeur = cle.slice(separateur + 1);
  if (type === "lieu") {
    if (!/^\d+$/.test(valeur)) return null;
    const id = Number(valeur);
    return Number.isSafeInteger(id) ? { type: "lieu", id } : null;
  }
  if (type === "createur") return valeur ? { type: "createur", pseudo: valeur } : null;
  if (type === "personne") return valeur ? { type: "personne", id: valeur } : null;
  return null;
}
