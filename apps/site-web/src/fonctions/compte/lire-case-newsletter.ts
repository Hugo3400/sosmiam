/**
 * La case « newsletter » du formulaire d'inscription de l'espace ambassadeur (cochée d'avance, décochable, sans
 * JavaScript) : true si elle est cochée, false si elle est décochée (l'API retient alors le « non »). Une case décochée
 * n'envoie rien : le champ caché « newsletterProposee » dit que la case était bien dans la page. Sans lui (page affichée
 * avant la case, autre formulaire) : undefined, rien n'est envoyé à l'API, donc aucun « non » n'est retenu par erreur.
 */
export function lireCaseNewsletter(formulaire: FormData): boolean | undefined {
  if (formulaire.get("newsletterProposee") !== "oui") return undefined;
  return formulaire.get("newsletter") === "oui";
}
