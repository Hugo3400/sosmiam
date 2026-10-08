/**
 * Version texte d'une newsletter, pour les messageries qui n'affichent pas le HTML : le texte tel qu'il est écrit (le
 * Markdown se lit très bien), puis le même pied de page que l'e-mail, avec la désinscription.
 */
export function creerTexteNewsletter(objet: string, texte: string, pourAmbassadeurs = false): string {
  return [
    objet,
    "",
    texte.trim(),
    "",
    "—",
    pourAmbassadeurs
      ? "Tu reçois ce mail parce que tu es ambassadeur SOS Miam. Une question ? Réponds simplement à ce mail, on lit tout."
      : "Tu reçois ce mail parce que tu t'es inscrit à la newsletter de SOS Miam. Plus envie ? Réponds simplement « STOP » à ce mail, ou écris à bonjour@sosmiam.fr : on te retire de la liste, sans question.",
  ].join("\n");
}
