// Aperçus publics de ce qu'on prépare pour l'app (sosmiam.fr/preview), annoncés dans le salon « roadmap » du Discord.
// Pages en noindex, hors du menu, du pied de page et du plan du site. Règle de docs/decisions.md : aucune date, aucune
// promesse (tests/apercus.test.ts le vérifie) : on montre où on en est, et ça peut encore changer.

/** Dit en haut et en bas de chaque aperçu */
export const EN_PREPARATION = "En préparation : ça peut encore changer";

export type Apercu = {
  /** Adresse de la page de l'aperçu */
  adresse: string;
  titre: string;
  emoji: string;
  accroche: string;
  /** Ce qu'on y voit, en quelques mots */
  points: string[];
};

/** Les cartes de /preview, une par aperçu */
export const APERCUS: Apercu[] = [
  {
    adresse: "/preview/communaute",
    titre: "L'Espace communauté",
    emoji: "🫶",
    accroche: "L'onglet Potes de l'app prend du volume : ta bande d'un côté, tous les Miamis de ta ville de l'autre.",
    points: ["Ma bande et les Miamis", "Les sorties des Miamis", "Qui est là ?", "La boîte à idées", "Les étiquettes des lieux"],
  },
];

/** Textes de la page /preview */
export const PAGE_APERCUS = {
  titreMeta: "Les aperçus",
  descriptionMeta: "Ce qu'on prépare en cuisine pour l'app SOS Miam : on te montre où on en est, et ça peut encore changer.",
  badge: "🧑‍🍳 Les coulisses de SOS Miam",
  titre: "Ce qu'on mijote en cuisine",
  chapo:
    "On te montre où on en est sur ce qu'on prépare pour l'app. Rien n'est figé : les écrans bougent, les idées aussi, et ton avis nous aide à choisir.",
  lienCarte: "Voir l'aperçu",
  avisTitre: "Ton avis compte",
  avisTexte: "Une remarque, une envie, un « et si… » ? Viens en parler avec les Miamis sur le Discord : c'est là qu'on goûte les idées avant de les servir.",
  avisBouton: "Donner mon avis sur le Discord",
};
