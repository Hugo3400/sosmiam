// Les motifs de refus d'une visite, tels que le lieu les choisit (mêmes clés que packages/commun/src/contenus/motifs-refus.ts),
// en version courte pour le logiciel. « retiree » : le lieu a annulé une validation dans les 15 minutes.
export const MOTIFS_REFUS_VISITE: Readonly<Record<string, string>> = {
  introuvable: "Addition introuvable",
  "pas-venu": "Personne pas là",
  doublon: "Déjà validée",
  autre: "Autre raison",
  retiree: "Validation retirée",
};
