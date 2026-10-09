/** Une valeur comparable : listes rangées (l'ordre des moyens de paiement ne compte pas), téléphone sans espaces ni
 * points, site sans « / » final, textes sans espaces autour. */
function comparable(champ: string, valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "null";
  if (Array.isArray(valeur)) return JSON.stringify([...valeur].map(String).sort());
  if (typeof valeur !== "string") return JSON.stringify(valeur);
  if (champ === "telephone") return JSON.stringify(valeur.replace(/[\s.\-]/g, ""));
  if (champ === "siteWeb") return JSON.stringify(valeur.trim().replace(/\/+$/, ""));
  return JSON.stringify(valeur.trim());
}

/**
 * Garde seulement les champs proposés qui changent vraiment par rapport à la fiche actuelle (un booléen à false face à
 * une info inconnue, null, est un changement). Objet vide : rien à changer.
 */
export function retirerChampsInchanges<T extends Record<string, unknown>>(proposition: T, actuel: Record<string, unknown>): Partial<T> {
  return Object.fromEntries(
    Object.entries(proposition).filter(([champ, valeur]) => comparable(champ, valeur) !== comparable(champ, actuel[champ])),
  ) as Partial<T>;
}
