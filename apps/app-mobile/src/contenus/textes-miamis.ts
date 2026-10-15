export const TEXTES_ESPACE_COMMUNAUTE = {
  titre: "Communauté",
  bande: "Ma bande",
  miamis: "Les Miamis",
  choisir: "Choisir l'espace",
} as const;

export const TEXTES_ACCUEIL_MIAMIS = {
  presentsSurtitre: (ville: string) => `${ville} · en ce moment`,
  presentsTitre: (n: number) =>
    n === 0 ? "Personne dans le coin pour l'instant. Et si tu ouvrais le bal ?" : n === 1 ? "Un Miami traîne dans le coin. Viens dire bonjour !" : `${n} Miamis traînent dans le coin. Viens dire bonjour !`,
  presentsBouton: "Qui est là ?",
  presentsNote: "Tu n'apparais ici que si tu l'as choisi. Jamais ta position, seulement ta ville.",
  sortiesTitre: "Sorties des Miamis",
  organiser: "+ Organiser",
  sortiesIntro: "Ouvertes à des Miamis que tu ne connais pas encore, toujours dans un lieu publié sur SOS Miam. La personne qui organise accepte chaque arrivée. Tes sorties entre potes restent dans « Ma bande ».",
  toutes: "Toutes",
  mesEnvies: "Mes envies",
  tesEnvies: "Tes envies : ",
  aucuneEnvie: "pas encore choisies",
  modifierEnvies: "Modifier",
  aucuneSortie: "Pas encore de sortie avec cette étiquette. Et si c'était toi qui lançais la première ?",
  aucuneEnvieChoisie: "Choisis d'abord tes envies avec « Modifier » : on te montrera les sorties qui te ressemblent.",
  aucuneSortieTitre: "Aucune sortie pour l'instant",
  aucuneSortieTexte: "Les Miamis de ta ville n'ont encore rien lancé. Un brunch, un resto, une tournée des crêpes : à toi l'honneur ?",
  organiserBouton: "Organiser la première",
  astuceGenre: "Les sorties réservées (entre filles, entre garçons, autres genres) se débloquent avec Mon genre : facultatif, et personne ne le voit.",
  astuceGenreLien: "Choisir mon genre",
  ideesTitre: "Boîte à idées",
  ideesLien: "Toutes les idées",
  ideesIntro: "Tu votes, la Brigade lit tout. Les plus miam passent devant.",
  ideesVide: "La boîte est encore vide. Une envie pour l'app ? Sois la première idée de la Brigade !",
  filTitre: "Ça bouge chez les Miamis",
  filVide: "C'est calme… trop calme. Lance une sortie ou une idée pour réveiller la Brigade !",
} as const;

export const TEXTES_MES_ENVIES = {
  titre: "Mes envies",
  sousTitre: "Les étiquettes qui te font envie : on met en avant les sorties qui te correspondent (« Te correspond »).",
  note: "Elles restent sur ton téléphone : personne d'autre ne les voit.",
  enregistrer: "C'est noté",
  annuler: "Annuler",
} as const;

export const REFUS_LIMITATION_MIAMIS = {
  venir: "Ton compte est limité : demander à venir à une sortie des Miamis attendra la fin de la limitation.",
} as const;

export const TEXTES_ACCES_MIAMIS = {
  demo: { emoji: "🧪", titre: "Les Miamis ne jouent pas la démo", texte: "Ici, tout est vrai : de vraies sorties, de vraies idées, de vrais Miamis. Quitte la démo et connecte-toi pour les rejoindre." },
  visite: { emoji: "👋", titre: "Les Miamis t'attendent", texte: "Crée ton compte pour rejoindre des sorties, voter pour les idées et dire coucou aux Miamis de ta ville." },
  bientot: { emoji: "🛠️", titre: "Les Miamis arrivent", texte: "La Brigade branche les sorties des Miamis, la boîte à idées et « Qui est là ? » sur le serveur. Encore un peu de patience !" },
  reessayer: "Réessayer",
  retour: "Retour",
} as const;
