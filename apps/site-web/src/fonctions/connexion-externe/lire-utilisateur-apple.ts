// Aucun import ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.

const lireNom = (valeur: unknown, maximum: number) =>
  typeof valeur === "string" && valeur.trim() !== "" && valeur.trim().length <= maximum ? valeur.trim() : null;

/**
 * Le champ « user » qu'Apple envoie UNE seule fois, à la toute première connexion :
 * {"name":{"firstName":"Zoé","lastName":"Martin"},"email":"…"}. Rend le prénom et le nom (null s'ils manquent ou si le
 * texte est illisible) ; l'e-mail, lui, est lu dans le jeton vérifié par l'API.
 */
export function lireUtilisateurApple(texte: unknown): { prenom: string | null; nom: string | null } {
  if (typeof texte !== "string" || texte.length > 2000) return { prenom: null, nom: null };
  try {
    const lu: unknown = JSON.parse(texte);
    const nom = typeof lu === "object" && lu !== null ? (lu as { name?: unknown }).name : null;
    if (typeof nom !== "object" || nom === null) return { prenom: null, nom: null };
    const { firstName, lastName } = nom as { firstName?: unknown; lastName?: unknown };
    return { prenom: lireNom(firstName, 40), nom: lireNom(lastName, 60) };
  } catch {
    return { prenom: null, nom: null };
  }
}
