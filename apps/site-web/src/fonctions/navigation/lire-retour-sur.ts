// Aucun import ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.

/** Adresse de retour sûre après la connexion : un chemin du site, jamais une autre adresse (« //exemple.fr »). */
export function lireRetourSur(valeur: unknown): string | null {
  return typeof valeur === "string" && /^\/(?!\/)[\w\-/]*$/.test(valeur) ? valeur : null;
}
