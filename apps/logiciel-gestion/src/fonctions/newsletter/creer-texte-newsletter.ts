/**
 * Version texte d'une newsletter, pour les messageries qui n'affichent pas le HTML : le texte tel qu'il est écrit (le
 * Markdown se lit très bien), puis le même pied de page que l'e-mail, avec la désinscription.
 */
export function creerTexteNewsletter(objet: string, texte: string, pour: "newsletter" | "ambassadeurs" | "comptes" = "newsletter"): string {
  return [
    objet,
    "",
    texte.trim(),
    "",
    "—",
    pour === "ambassadeurs"
      ? "Tu reçois ce mail parce que tu es ambassadeur SOS Miam. Une question ? Réponds simplement à ce mail, on lit tout."
      : pour === "comptes"
      ? "Tu reçois ce mail parce que tu as un compte SOS Miam : c'est une information sur le service, pas de la pub. Une question ? Réponds simplement à ce mail."
      : "Tu reçois ce mail parce que tu t'es inscrit à la newsletter de SOS Miam. Plus envie ? Réponds simplement « STOP » à ce mail, ou écris à bonjour@sosmiam.fr : on te retire de la liste, sans question.",
  ].join("\n");
}
