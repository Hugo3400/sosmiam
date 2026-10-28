import { MAX_LIEUX_SONDAGE, MIN_LIEUX_SONDAGE, QUESTION_SONDAGE } from "@sos-miam/commun/regles/chat";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_SONDAGE_ANGLAIS } from "~/contenus/anglais/textes-sondage";

export const TEXTES_SONDAGE = {
  question: QUESTION_SONDAGE,
  explication: `Choisis ${MIN_LIEUX_SONDAGE} à ${MAX_LIEUX_SONDAGE} lieux. La bande vote, et le gagnant ouvre la sortie, déjà remplie.`,
  chercher: "Un lieu, un plat, un quartier…",
  chercherLu: "Chercher un lieu",
  aucunLieu: "Aucun lieu ne correspond, essaie un autre mot.",
  finDuVote: "Fin du vote",
  envoyer: (n: number) => (n > 0 ? `Envoyer le sondage (${n} lieu${n > 1 ? "x" : ""})` : "Envoyer le sondage"),
  indiceEnvoyer: `Il faut entre ${MIN_LIEUX_SONDAGE} et ${MAX_LIEUX_SONDAGE} lieux`,
  choisi: "Choisi",
  pasChoisi: "Pas choisi",
  plein: `${MAX_LIEUX_SONDAGE} lieux, c'est déjà un beau dilemme : retire-en un pour en mettre un autre.`,
  pasAssez: `Choisis au moins ${MIN_LIEUX_SONDAGE} lieux, sinon le vote est vite plié 😄`,
  finPassee: "Cette fin de vote arrive trop vite : choisis-en une autre.",
  lieuxRefuses: "Un des lieux n'est plus disponible. Choisis-en un autre !",
  pasParti: "Le sondage n'a pas pu partir : cette discussion n'est plus ouverte pour toi.",
  envoye: "🗳️ Sondage envoyé : que le meilleur gagne !",
  reserveGroupes: "Les sondages « On mange où ? » se lancent dans un groupe de potes.",
  piedOuvert: "Le lieu gagnant ouvre la sortie, déjà remplie.",
  gagnant: "Gagnant",
  voteFini: "Vote fini",
  tonVote: "ton vote",
  voix: (n: number) => `${n} vote${n > 1 ? "s" : ""}`,
  voter: "Touche pour voter",
  retirer: "Touche encore pour retirer ton vote",
  changer: "Touche pour changer ton vote",
  creerSortie: "Créer la sortie",
  indiceCreerSortie: "Le lieu gagnant et le groupe sont déjà remplis",
  lieuParti: "Ce lieu n'est plus là",
  sondageClos: "🗳️ Le vote est fini : va voir qui a gagné !",
  voteRate: "Ton vote n'est pas passé : ta connexion fait la sieste. Réessaie dans un instant 📡",
  voteMis: (nom: string) => `Vote pour ${nom}`,
  voteRetire: "Vote retiré",
} as const;

export const TEXTES_SONDAGE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SONDAGE>> = { fr: TEXTES_SONDAGE, en: TEXTES_SONDAGE_ANGLAIS };
