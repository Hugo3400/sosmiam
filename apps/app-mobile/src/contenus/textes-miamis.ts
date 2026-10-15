import type { ChoixGenre } from "@sos-miam/commun/types/genre";

export const TEXTES_ESPACE_COMMUNAUTE = {
  titre: "Communauté",
  bande: "Ma bande",
  miamis: "Les Miamis",
  choisir: "Choisir l'espace",
} as const;

export const TEXTES_ACCUEIL_MIAMIS = {
  demo: "Miamis d'exemple",
  demoSuite: " : ils acceptent, votent et répondent tout seuls. Rien ne part sur le serveur.",
  bientotTitre: "Les Miamis arrivent",
  bientotTexte: "Sorties ouvertes, boîte à idées et « Qui est là ? » : la Brigade branche tout ça sur le serveur. Ta bande, elle, t'attend juste à côté.",
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
  astuceGenre: "Les sorties réservées (entre filles, entre garçons, autres genres) se débloquent avec Mon genre : facultatif, et personne ne le voit.",
  astuceGenreLien: "Choisir mon genre",
  ideesTitre: "Boîte à idées",
  ideesLien: "Toutes les idées",
  ideesIntro: "Tu votes, la Brigade lit tout. Les plus miam passent devant.",
  filTitre: "Ça bouge chez les Miamis",
  filVide: "C'est calme… trop calme. Lance une sortie ou une idée pour réveiller la Brigade !",
} as const;

export const TEXTES_MES_ENVIES = {
  titre: "Mes envies",
  sousTitre: "Les étiquettes qui te font envie : on met en avant les sorties qui te correspondent (« Te correspond »).",
  note: "Dans « Qui est là ? », on montre vos envies en commun, jamais celles qui parlent de religion ou de santé.",
  enregistrer: "C'est noté",
  annuler: "Annuler",
} as const;

export const TEXTES_QUI_EST_LA = {
  titre: "Qui est là ?",
  intro: (ville: string) =>
    `Les Miamis de ${ville} qui ont choisi d'apparaître ici. Fais coucou : si c'est réciproque, vous pouvez vous ajouter à vos bandes. Sinon, rien de plus : pas de notification, pas de pression.`,
  montrer: "Me montrer ici",
  visible: "Les Miamis de ta ville te voient ici (pseudo et avatar).",
  invisible: "Tu es invisible ici, et tu ne peux pas faire coucou.",
  mutuelTitre: (pseudo: string) => `@${pseudo} et toi, vous vous êtes fait coucou !`,
  mutuelEnvies: (envies: string[]) =>
    envies.length === 0 ? "De quoi papoter : un coucou, c'est déjà un début." : `Vous avez ${envies.length > 1 ? `${envies.length} envies` : "une envie"} en commun : ${envies.join(", ")}.`,
  ajouter: "Ajouter à ma bande",
  demandeEnvoyee: "Demande envoyée",
  plusTard: "Plus tard",
  coucou: "Coucou",
  coucouEnvoye: "Coucou envoyé",
  pote: "Pote",
  aFaitCoucou: "T'a fait coucou",
  dansTaBande: "Dans ta bande",
  ambassadeur: "Du programme Ambassadeurs",
  nouveau: "Vient d'arriver en ville",
  rescousses: (n: number) => (n > 1 ? `${n} rescousses` : `${n} rescousse`),
  organise: (titre: string) => `organise ${titre}`,
  enCommun: (envies: string[]) => (envies.length === 1 ? `${envies[0]} en commun` : `${envies.length} envies en commun`),
  vide: "Personne pour l'instant. Reviens à l'heure du déjeuner, c'est là que ça bouge !",
  invisiblePourCoucou: "Montre-toi d'abord ici pour faire coucou : c'est donnant-donnant.",
  coucouParti: (prenom: string) => `👋 Coucou envoyé à ${prenom}.`,
  demandePartie: (prenom: string) => `🤝 Demande envoyée à ${prenom} pour rejoindre ta bande.`,
} as const;

export const TEXTES_GENRE = {
  titre: "Mon genre",
  intro: "Facultatif. Il sert à une seule chose : te montrer les sorties réservées (entre filles, entre garçons, autres genres). Personne ne le voit : ni les autres Miamis, ni les lieux.",
  regle: "Tu peux le changer une fois par mois, pour que les sorties réservées restent entre les bonnes personnes.",
  bloque: (date: string) => `C'est enregistré. Prochain changement possible le ${date} (une fois par mois).`,
  jamaisTitre: "Ce qu'on ne te demandera jamais",
  jamaisTexte: "Ton orientation. « LGBT+ friendly » est une étiquette de sortie, que chacun peut choisir ou filtrer, pas une case de ton profil.",
  enregistrer: "Enregistrer",
  enregistre: "Enregistré",
  ligneReglage: "Mon genre",
  ligneSection: "Communauté",
  ligneVide: "Facultatif, et invisible pour les autres",
} as const;

export const OPTIONS_GENRE: readonly { id: ChoixGenre; nom: string; effet: string }[] = [
  { id: "femme", nom: "Femme", effet: "Tu vois aussi les sorties « Entre filles »." },
  { id: "homme", nom: "Homme", effet: "Tu vois aussi les sorties « Entre garçons »." },
  { id: "autre", nom: "Autres", effet: "Tu vois aussi les sorties « Autres genres »." },
  { id: "ne-pas-dire", nom: "Je préfère ne pas dire", effet: "Tu vois les sorties ouvertes à tous, pas les sorties réservées." },
];

export const REFUS_LIMITATION_MIAMIS = {
  venir: "Ton compte est limité : demander à venir à une sortie des Miamis attendra la fin de la limitation.",
  idee: "Ton compte est limité : proposer une idée attendra la fin de la limitation. Voter « Miam ! », tu peux toujours.",
  coucou: "Ton compte est limité : les coucous attendront la fin de la limitation.",
  apparaitre: "Ton compte est limité : apparaître dans « Qui est là ? » attendra la fin de la limitation.",
} as const;
