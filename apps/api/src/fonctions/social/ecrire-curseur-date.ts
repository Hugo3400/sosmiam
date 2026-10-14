/**
 * Le curseur d'une page (`suite`, renvoyé tel quel dans `?apres=`) : « <date ISO>_<id> » en base64url. Ce n'est que du
 * base64url, lisible par tous : l'id doit être celui d'une ligne que l'app connaît déjà (notification de la cloche, message…),
 * JAMAIS l'id d'un compte (pour une page de personnes : ecrireCurseurPersonne, avec l'identifiant public). L'id départage
 * deux lignes de la même milliseconde.
 */
export function ecrireCurseurDate(date: Date, id: number): string {
  return Buffer.from(`${date.toISOString()}_${id}`, "utf8").toString("base64url");
}
