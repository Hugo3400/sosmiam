import { DELAI_MIN_RESERVATION_MS, EXPIRATION_AVANT_CRENEAU_MS, PERSONNES_RESERVATION_MAX } from "@sos-miam/commun/regles/reservations";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";
import type { MomentCreneau } from "~/fonctions/reservations/grouper-creneaux-reservation";
import type { RaisonSansCreneau } from "~/fonctions/reservations/lire-raison-sans-creneau";

const DELAI_AVANCE = ecrireAttente(DELAI_MIN_RESERVATION_MS);
const MINUTES_AVANT_EXPIRATION = Math.round(EXPIRATION_AVANT_CRENEAU_MS / 60_000);

export const TEXTES_RESERVER_TABLE = {
  titre: "Réserver une table",
  titreSortie: "Réserver ta place",
  sousTitre: "Gratuit, sans carte bancaire : l'équipe te répond dans l'app.",
  jour: "Quel jour ?",
  heure: "À quelle heure ?",
  heureDeParis: "Les heures sont celles du lieu, à l'heure de Paris.",
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
  envoi: "Envoi…",
  indiceEnvoyer: "Envoie ta demande au lieu, qui te répond dans l'app",
  indiceSansHeure: "Choisis d'abord le jour et l'heure",
  prochainJourOuvert: "Voir le prochain jour ouvert",
  indiceProchainJourOuvert: "Choisit le prochain jour avec des créneaux",
  sansHorairesTitre: "Pas encore d'horaires ici",
  sansHorairesTexte: "L'équipe {deLieu} n'a pas encore mis ses horaires dans l'app, alors on ne peut pas te proposer de créneau. Passe les voir ou appelle-les : ils seront ravis.",
  lieuIntrouvableTitre: "Ce lieu n'est plus là",
  lieuIntrouvableTexte: "Il n'est plus sur SOS Miam pour l'instant. Plein d'autres pépites t'attendent dans l'Explorer.",
  voirExplorer: "Voir d'autres pépites",
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
    texte: `On réserve au moins ${DELAI_AVANCE} à l'avance, pour laisser à l'équipe le temps de te répondre : le dernier créneau du jour est passé. Un autre jour, ça te dit ?`,
  },
};

export const MOMENTS_CRENEAUX: Readonly<Record<MomentCreneau, { emoji: string; libelle: string }>> = {
  matin: { emoji: "🌅", libelle: "Le matin" },
  midi: { emoji: "☀️", libelle: "Le midi" },
  "apres-midi": { emoji: "🍰", libelle: "L'après-midi" },
  soir: { emoji: "🌙", libelle: "Le soir" },
};

export const TEXTES_REFUS_RESERVATION: Readonly<Partial<Record<ErreurService, string>>> = {
  "email-non-verifie": "Pour réserver, il faut un e-mail confirmé. Touche le lien qu'on t'a envoyé, ou redemande-le depuis ton compte.",
  "membre-du-lieu": "On ne réserve pas chez soi : ta table, tu la connais déjà ! Va plutôt goûter chez les voisins.",
  "hors-ligne": "Rien n'est parti. Vérifie ta connexion, puis renvoie : tes choix t'attendent ici.",
  introuvable: "Ce lieu n'est plus sur SOS Miam pour l'instant. Reviens à l'Explorer pour en dénicher un autre.",
};

export const PETIT_MOT_REFUSE = {
  emoji: "✋",
  titre: "Ton petit mot ne passe pas",
  texte: "Il contient un terme qu'on ne laisse pas passer. Reformule-le juste au-dessus, ou envoie ta demande sans.",
  sousLeChamp: "On reformule ? Ton petit mot contient un terme qu'on ne laisse pas passer.",
} as const;

export const ACTIONS_REFUS_RESERVATION = {
  retourFiche: "Retour à la fiche",
  voirExplorer: "Voir l'Explorer",
  voirReservations: "Voir mes réservations",
  confirmerEmail: "Confirmer mon e-mail",
} as const;

export const TEXTES_DEMANDE_ENVOYEE = {
  titre: "Demande envoyée !",
  sousTitre: "L'équipe {deLieu} te répond ici, dans l'app : sa réponse arrive dans Mes réservations.",
  titreAcceptee: "C'est réservé !",
  sousTitreAcceptee: "L'équipe {deLieu} t'attend. Le jour J, touche « Je\u00a0suis\u00a0là » en arrivant : ici, ou dans Mes réservations.",
  titreRefusee: "Pas cette fois",
  sousTitreRefusee: "L'équipe {deLieu} a répondu : la carte t'explique pourquoi. Un autre créneau te tente ?",
  titreEndormie: "Demande endormie",
  sousTitreEndormie: "L'équipe {deLieu} n'a pas répondu à temps. Un autre créneau te tente ?",
  titreAnnulee: "Demande annulée",
  titreReservationAnnulee: "Réservation annulée",
  sousTitreAnnulee: "Une autre date te tente ? Choisis un nouveau créneau : le lieu t'attend peut-être déjà.",
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
