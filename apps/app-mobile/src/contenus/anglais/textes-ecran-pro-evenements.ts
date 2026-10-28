import { DESCRIPTION_EVENEMENT_MAX, EVENEMENTS_A_VENIR_MAX, TITRE_EVENEMENT_MAX, TITRE_EVENEMENT_MIN } from "@sos-miam/commun/regles/evenements";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_EVENEMENT, TEXTES_ECRAN_EVENEMENTS } from "~/contenus/textes-ecran-pro-evenements";

export const TEXTES_ECRAN_EVENEMENTS_ANGLAIS: Traduction<typeof TEXTES_ECRAN_EVENEMENTS> = {
  titre: "Events",
  nouvel: "New event",
  pleinIndice: `${EVENEMENTS_A_VENIR_MAX} upcoming events max – cancel one or wait for one to go by`,
  aVenir: "Coming up",
  vide: "Nothing planned yet. A gig, a quiz, a workshop? Foodies who follow you will get a notification.",
  plein: `${EVENEMENTS_A_VENIR_MAX} upcoming events max.`,
  finis: "Past and cancelled",
};

export const TEXTES_ECRAN_EVENEMENT_ANGLAIS: Traduction<typeof TEXTES_ECRAN_EVENEMENT> = {
  chargement: "Event",
  introuvableTitre: "Event not found",
  introuvableTexte: "It may have been cancelled in the meantime.",
  retour: "Back",
  modifier: "Edit event",
  nouvel: "New event",
  sousTitre: "on your listing, in Explore, and for everyone who follows you",
  enCours: "Just a sec…",
  enregistrer: "Save changes",
  publier: "Post the event",
  essentiel: "The essentials",
  champTitre: "Title",
  champTitreExemple: "Jazz manouche by the fire",
  type: "What is it?",
  description: "Details",
  facultatif: "optional",
  descriptionExemple: "What's in store for foodies, the programme, anything worth knowing",
  quand: "When",
  prixPlaces: "Price and spots",
  interesses: (n: number, publiePar: string | null) =>
    `${n} ${n === 1 ? "person" : "people"} interested${publiePar ? ` · posted by ${publiePar}` : ""}`,
  annuler: "Cancel event",
  annulationTitre: "Cancel the event?",
  annulationDetail: "All its upcoming dates are cancelled. People who are interested will see “Cancelled”.",
  garder: "Keep it",
  erreurs: {
    titre: `Between ${TITRE_EVENEMENT_MIN} and ${TITRE_EVENEMENT_MAX} characters, with no rude words or “open bar”.`,
    type: "Pick a type.",
    description: `${DESCRIPTION_EVENEMENT_MAX} characters max, with no rude words or “open bar”.`,
    debut: "A date in the future, no more than 3 months ahead.",
    fin: "No more than 24 hours after the start.",
    hebdoJusqua: "At least a week, and no more than 3 months ahead.",
    tarif: "Pick a price.",
    prixCentimes: "Check the price.",
    places: "Check the number of spots.",
    alcool: "Have another look at this box.",
  },
};
