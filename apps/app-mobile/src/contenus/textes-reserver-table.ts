import { DELAI_MIN_RESERVATION_MS, EXPIRATION_AVANT_CRENEAU_MS, PERSONNES_RESERVATION_MAX } from "@sos-miam/commun/regles/reservations";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import type { MomentCreneau } from "~/fonctions/reservations/grouper-creneaux-reservation";
import type { RaisonSansCreneau } from "~/fonctions/reservations/lire-raison-sans-creneau";

const MINUTES_AVANCE = Math.round(DELAI_MIN_RESERVATION_MS / 60_000);
const MINUTES_AVANT_EXPIRATION = Math.round(EXPIRATION_AVANT_CRENEAU_MS / 60_000);

export const TEXTES_RESERVER_TABLE = {
  titre: "Réserver une table",
  sousTitre: "Gratuit, sans carte bancaire : l'équipe te répond dans l'app.",
  jour: "Quel jour ?",
  heure: "À quelle heure ?",
  personnes: "Vous serez combien ?",
  personnesLu: "Nombre de personnes",
  grandeTablee: `Plus de ${PERSONNES_RESERVATION_MAX} ? Appelle directement le lieu : les grandes tablées, ça s'organise de vive voix.`,
  petitMot: "Un petit mot pour l'équipe",
  petitMotMention: "facultatif",
  petitMotExemple: "Une chaise haute pour Léon, c'est possible ?",
  petitMotAide: "L'équipe le lit avec ta demande",
  recapTitre: "Ta demande",
  recapSansPetitMot: "Sans petit mot",
  recapNote: `Gratuit, sans carte bancaire. Sans réponse ${MINUTES_AVANT_EXPIRATION}\u00a0min avant le créneau, la demande s'endort toute seule.`,
  envoyer: "Envoyer ma demande",
  envoyerSansPetitMot: "Envoyer sans petit mot",
  indiceEnvoyer: "Envoie ta demande au lieu, qui te répond dans l'app",
  indiceSansHeure: "Choisis d'abord le jour et l'heure",
  prochainJourOuvert: "Voir le prochain jour ouvert",
  indiceProchainJourOuvert: "Choisit le prochain jour avec des créneaux",
} as const;

export const SANS_CRENEAU: Readonly<Record<RaisonSansCreneau, { emoji: string; court: string; lu: string; titre: string; texte: string }>> = {
  ferme: {
    emoji: "😴",
    court: "Fermé",
    lu: "fermé",
    titre: "Fermé ce jour-là",
    texte: "L'équipe {deLieu} recharge les batteries. Choisis un autre jour : elle t'attend de pied ferme.",
  },
  "trop-tard": {
    emoji: "🌙",
    court: "Trop tard",
    lu: "plus de créneau",
    titre: "Plus de créneau aujourd'hui",
    texte: `On réserve au moins ${MINUTES_AVANCE}\u00a0min à l'avance, et la dernière table du jour est déjà partie. Demain, ça te dit ?`,
  },
};

export const MOMENTS_CRENEAUX: Readonly<Record<MomentCreneau, { emoji: string; libelle: string }>> = {
  matin: { emoji: "🌅", libelle: "Le matin" },
  midi: { emoji: "☀️", libelle: "Le midi" },
  "apres-midi": { emoji: "🍰", libelle: "L'après-midi" },
  soir: { emoji: "🌙", libelle: "Le soir" },
};

export const TEXTES_REFUS_RESERVATION: Readonly<Partial<Record<ErreurService, string>>> = {
  "email-non-verifie":
    "Pour réserver, il faut un e-mail confirmé : le lieu doit pouvoir compter sur toi. Touche le lien qu'on t'a envoyé, ou redemande-le depuis ton compte.",
  "membre-du-lieu": "On ne réserve pas chez soi : ta table, tu la connais déjà ! Va plutôt goûter chez les voisins.",
  "hors-ligne": "Rien n'est parti. Vérifie ta connexion, puis renvoie : tes choix t'attendent ici.",
  introuvable: "Ce lieu n'est plus sur SOS Miam pour l'instant. Retourne sur la fiche pour en dénicher un autre.",
};

export const ACTIONS_REFUS_RESERVATION = {
  retourFiche: "Retour à la fiche",
  voirReservations: "Voir mes réservations",
  confirmerEmail: "Confirmer mon e-mail",
} as const;

export const TEXTES_DEMANDE_ENVOYEE = {
  titre: "Demande envoyée !",
  sousTitre: "L'équipe {deLieu} te répond ici, dans l'app. Tu reçois une notif dès qu'elle a tranché.",
  titreAnnulee: "Demande annulée",
  sousTitreAnnulee: "Une autre date te tente ? Choisis un nouveau créneau, la table t'attend peut-être déjà.",
  etapesTitre: "Et ensuite ?",
  etapes: [
    { emoji: "📬", texte: "L'équipe regarde son planning et accepte, ou te dit si c'est complet (ça arrive aux meilleurs)." },
    { emoji: "📍", texte: "Le jour J, touche « Je suis là » en arrivant, dans Mes réservations : l'équipe sait que c'est toi." },
    { emoji: "🛟", texte: "Ta visite compte pour de vrai : des points, un tampon s'il y a une carte de fidélité, et ton avis vérifié." },
  ],
  voirReservations: "Voir mes réservations",
  retourFiche: "Retour à la fiche",
  autreCreneau: "Choisir un autre créneau",
  annonce: "Demande envoyée. Le lieu te répond dans l'app.",
} as const;
