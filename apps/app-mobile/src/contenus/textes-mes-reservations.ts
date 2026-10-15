import { RESERVATIONS_A_VENIR_MAX } from "@sos-miam/commun/regles/reservations";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

export const TEXTES_MES_RESERVATIONS = {
  titre: "Mes réservations",
  sousTitre: "Tes demandes et les réponses des lieux. C'est gratuit, sans carte bancaire, et si tu ne peux plus venir, tu annules d'un geste.",
  noteMaximum: `${RESERVATIONS_A_VENIR_MAX} réservations en cours, c'est le maximum : de quoi laisser de la place aux autres Miamis. Dès qu'une est passée ou annulée, tu peux en refaire une.`,
  chargement: "On rassemble tes réservations…",
  reessayer: "Réessayer",
  indiceReessayer: "Relit tes réservations",
  positionEnCours: "On regarde où tu es…",
  envoiPresence: "On prévient le lieu…",
  presenceNotee: "C'est noté, tu es sur place. Donne ton code à l'équipe.",
} as const;

export const TEXTES_ECHEC_GESTE_RESERVATION: Readonly<Partial<Record<ErreurService, string>>> = {
  "transition-interdite": "Elle a bougé entre-temps (une réponse du lieu, peut-être) : la liste est à jour.",
  "delai-depasse": "Le créneau est déjà passé : il n'y a plus rien à annuler.",
  introuvable: "Cette réservation n'existe plus de ton côté. La liste est à jour.",
  "hors-ligne": "Rien n'est parti. Vérifie ta connexion, puis réessaie : rien n'est perdu.",
};

export const ENTREE_MES_RESERVATIONS = {
  titre: "Mes réservations",
  indice: "Ouvre tes réservations",
  vide: "Pas encore de table en vue : réserve depuis la fiche d'une pépite",
} as const;

export const SECTION_RESERVATIONS_SCAN = {
  titre: "Mes réservations",
  vide: "Pas de table réservée pour l'instant. Le jour J, c'est ici que tu touches « Je suis là » en arrivant.",
  indiceLigne: "Ouvre tes réservations",
} as const;
