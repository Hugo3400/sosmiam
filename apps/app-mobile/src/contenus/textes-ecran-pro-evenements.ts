import { DESCRIPTION_EVENEMENT_MAX, EVENEMENTS_A_VENIR_MAX, TITRE_EVENEMENT_MAX, TITRE_EVENEMENT_MIN } from "@sos-miam/commun/regles/evenements";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_EVENEMENT_ANGLAIS, TEXTES_ECRAN_EVENEMENTS_ANGLAIS } from "~/contenus/anglais/textes-ecran-pro-evenements";

export const TEXTES_ECRAN_EVENEMENTS = {
  titre: "Événements",
  nouvel: "Nouvel événement",
  pleinIndice: `${EVENEMENTS_A_VENIR_MAX} événements à venir au plus : annule ou attends qu'un soit passé`,
  aVenir: "À venir",
  vide: "Rien de prévu pour l'instant. Un concert, un quiz, un atelier ? Les gourmands qui te suivent seront prévenus.",
  plein: `${EVENEMENTS_A_VENIR_MAX} événements à venir au plus.`,
  finis: "Passés et annulés",
} as const;

export const TEXTES_ECRAN_EVENEMENTS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_EVENEMENTS>> = { fr: TEXTES_ECRAN_EVENEMENTS, en: TEXTES_ECRAN_EVENEMENTS_ANGLAIS };

export const TEXTES_ECRAN_EVENEMENT = {
  chargement: "Événement",
  introuvableTitre: "Événement introuvable",
  introuvableTexte: "Il a peut-être été annulé entre-temps.",
  retour: "Retour",
  modifier: "Modifier l'événement",
  nouvel: "Nouvel événement",
  sousTitre: "sur ta fiche, dans Explorer, et chez qui te suit",
  enCours: "Un instant…",
  enregistrer: "Enregistrer",
  publier: "Publier l'événement",
  essentiel: "L'essentiel",
  champTitre: "Titre",
  champTitreExemple: "Jazz manouche au coin du feu",
  type: "C'est quoi ?",
  description: "Description",
  facultatif: "facultatif",
  descriptionExemple: "Ce qui attend les gourmands, le programme, ce qu'il faut savoir",
  quand: "Quand",
  prixPlaces: "Prix et places",
  interesses: (n: number, publiePar: string | null) =>
    `${n} personne${n > 1 ? "s" : ""} intéressée${n > 1 ? "s" : ""}${publiePar ? ` · publié par ${publiePar}` : ""}`,
  annuler: "Annuler l'événement",
  annulationTitre: "Annuler l'événement ?",
  annulationDetail: "Toutes ses dates à venir sont annulées. Les personnes intéressées verront « Annulé ».",
  garder: "Je le garde",
  erreurs: {
    titre: `De ${TITRE_EVENEMENT_MIN} à ${TITRE_EVENEMENT_MAX} caractères, sans gros mot ni « open bar ».`,
    type: "Choisis un type.",
    description: `${DESCRIPTION_EVENEMENT_MAX} caractères au plus, sans gros mot ni « open bar ».`,
    debut: "Une date à venir, 3 mois à l'avance au plus.",
    fin: "24 h au plus après le début.",
    hebdoJusqua: "Au moins une semaine, et 3 mois à l'avance au plus.",
    tarif: "Choisis un tarif.",
    prixCentimes: "Prix à corriger.",
    places: "Places à corriger.",
    alcool: "Case à revoir.",
  },
} as const;

export const TEXTES_ECRAN_EVENEMENT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_EVENEMENT>> = { fr: TEXTES_ECRAN_EVENEMENT, en: TEXTES_ECRAN_EVENEMENT_ANGLAIS };
