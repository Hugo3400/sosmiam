/**
 * Le curseur d'une page de personnes (abonnés, abonnements : `suite`, renvoyé tel quel dans `?apres=`) : « <date ISO>_<identifiant
 * public> » en base64url. Ce n'est que du base64url, lisible par tous : jamais l'id d'un compte dedans (les id se suivent, ils
 * diraient combien il y a de comptes et relieraient un identifiant public à son compte). Le serveur retrouve le compte de
 * l'identifiant public pour départager deux lignes de la même seconde.
 */
export function ecrireCurseurPersonne(date: Date, idPublic: string): string {
  return Buffer.from(`${date.toISOString()}_${idPublic}`, "utf8").toString("base64url");
}
