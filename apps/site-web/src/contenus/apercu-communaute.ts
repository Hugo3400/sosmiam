// Textes de l'aperçu de l'Espace communauté (sosmiam.fr/preview/communaute). Les écrans dessinés sont dans
// composants/apercus/ (pseudos et lieux inventés). Aucune date, aucune promesse : on y travaille, ça peut encore changer.

export type IdBlocCommunaute = "communaute" | "sorties" | "places" | "qui-est-la" | "idees" | "etiquettes";

export type ListeBloc = { titre: string; elements: string[] };

export type BlocCommunaute = {
  id: IdBlocCommunaute;
  /** Court, pour le sommaire « Au menu » */
  court: string;
  titre: string;
  /** Deux ou trois phrases */
  phrases: string[];
  /** Petites listes d'étiquettes sous le texte (facultatives) */
  listes?: ListeBloc[];
  /** Ce que montre l'écran dessiné, pour les lecteurs d'écran */
  alt: string;
};

export const HAUT_COMMUNAUTE = {
  titreMeta: "Aperçu de l'Espace communauté",
  descriptionMeta:
    "L'onglet Potes de l'app devient Communauté : ta bande, les sorties des Miamis et « Qui est là ? ». La boîte à idées, elle, se range dans les paramètres. En préparation, ça peut encore changer.",
  retour: "Tous les aperçus",
  titre: "L'Espace communauté",
  chapo:
    "On y travaille : un coin de l'app pour retrouver ta bande et rencontrer d'autres Miamis autour d'une bonne table. On te montre où on en est, écran par écran.",
  exemples: "Les écrans sont des exemples : pseudos et lieux inventés, chiffres pour de faux.",
  sommaire: "Au menu",
};

export const BLOCS_COMMUNAUTE: BlocCommunaute[] = [
  {
    id: "communaute",
    court: "Ma bande et les Miamis",
    titre: "L'onglet Potes devient « Communauté »",
    phrases: [
      "Deux parties, et un geste pour passer de l'une à l'autre.",
      "« Ma bande », ce sont tes vrais potes : vos sorties, vos votes pour le lieu, votre discussion.",
      "« Les Miamis », c'est toute la communauté de ta ville, pour croiser d'autres gourmands sans se prendre la tête.",
    ],
    listes: [{ titre: "Les deux parties", elements: ["Ma bande", "Les Miamis"] }],
    alt: "Écran Communauté de l'app : deux onglets, Ma bande et Les Miamis. Sur Les Miamis, on voit qui traîne en ville, une sortie à rejoindre et la boîte à idées.",
  },
  {
    id: "sorties",
    court: "Les sorties des Miamis",
    titre: "Les sorties des Miamis",
    phrases: [
      "N'importe quel Miami peut lancer une sortie ouverte à tous, toujours dans un lieu vérifié, et c'est l'organisateur qui accepte chaque arrivée.",
      "S'il le choisit, il peut la réserver à un public pour que chacun se sente à l'aise : c'est fait pour se retrouver, jamais pour mettre quelqu'un de côté.",
      "Les étiquettes t'aident à trouver la sortie qui te ressemble, et ton genre reste facultatif et invisible pour les autres.",
    ],
    listes: [
      {
        titre: "Publics réservés, si l'organisateur le choisit",
        elements: ["Entre filles", "Entre garçons", "Autres genres", "Une tranche d'âge", "Les nouveaux", "Les ambassadeurs"],
      },
      { titre: "Quelques étiquettes", elements: ["Vegan", "LGBT+ friendly", "Petit budget", "Sans alcool", "Timides bienvenus", "Accessible en fauteuil"] },
    ],
    alt: "Liste des sorties des Miamis : une soirée jeux entre filles, un brunch des nouveaux arrivants et une tournée des crêpes, chacune avec ses places libres et ses étiquettes.",
  },
  {
    id: "places",
    court: "Une place pour chacun",
    titre: "Une place pour chacun",
    phrases: [
      "Sortie complète ? Tu passes en liste d'attente et tu entres dès qu'une place se libère ; un rappel arrive la veille, et « Je ne peux plus venir » libère ta place en un geste.",
      "Sur place, le QR du comptoir confirme ta présence.",
      "Une sortie qui revient chaque semaine invite d'abord ses habitués, et l'organisateur peut garder une place pour quelqu'un de nouveau dans l'app ou dans la ville.",
    ],
    listes: [{ titre: "En bref", elements: ["Liste d'attente", "Rappel la veille", "Présence au QR du comptoir", "Les habitués", "Une place pour un nouveau"] }],
    alt: "Écran d'une sortie : le brunch des nouveaux arrivants au Restaurant du Capitaine Bouiboui, qui vient, une place gardée pour un nouveau, la liste d'attente et le bouton du QR du comptoir.",
  },
  {
    id: "qui-est-la",
    court: "Qui est là ?",
    titre: "« Qui est là ? »",
    phrases: [
      "Les Miamis de ta ville qui l'ont choisi apparaissent ici, avec leur pseudo et leur avatar : jamais leur position, seulement la ville.",
      "Fais-leur coucou : si c'est réciproque, vous pouvez vous ajouter à vos bandes.",
      "Sinon, rien ne se passe et personne n'est prévenu. Zéro malaise.",
    ],
    alt: "Écran « Qui est là ? » : l'interrupteur « Me montrer ici », un coucou réciproque avec deux envies en commun, et une liste de Miamis avec un bouton Coucou.",
  },
  {
    id: "idees",
    court: "La boîte à idées",
    titre: "La boîte à idées",
    phrases: [
      "Une envie pour l'app ? Propose-la, et vote « Miam ! » pour celles des autres : les plus miam passent devant.",
      "La Brigade lit tout, répond sous les idées et met une idée du mois à l'honneur.",
      "Avant que tu envoies la tienne, l'app te montre celles qui lui ressemblent : un vote de plus vaut mieux qu'un doublon.",
    ],
    listes: [{ titre: "En bref", elements: ["Votes « Miam ! »", "Réponses de la Brigade", "Idée du mois", "Anti-doublons"] }],
    alt: "Écran Boîte à idées : l'idée du mois, des idées classées par votes « Miam ! », une réponse de la Brigade et une idée qui ressemble à une autre.",
  },
  {
    id: "etiquettes",
    court: "Les étiquettes des lieux",
    titre: "Des étiquettes sur les lieux",
    phrases: [
      "Dans Explorer, les lieux portent aussi des étiquettes : vegan, accessible en fauteuil, petit budget, calme…",
      "Le lieu confirme les siennes, les Miamis peuvent en proposer, et on voit toujours qui a dit quoi.",
      "Un filtre, et tu trouves l'adresse qui te va.",
    ],
    alt: "Écran Explorer : des filtres par étiquette et trois lieux inventés, avec les étiquettes confirmées par le lieu et celles proposées par les Miamis.",
  },
];

export const BAS_COMMUNAUTE = {
  titre: "Ça te parle ? Ça te gratte ?",
  texte:
    "Dis-le-nous sur le Discord : c'est là qu'on en parle avec les Miamis. Une remarque, une envie, un « et si… » : tout nous aide à cuisiner la suite.",
  bouton: "Donner mon avis sur le Discord",
  rappel: "Ces écrans montrent où on en est, pas une version finale.",
};
