import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_NOUVELLE_SORTIE_ANGLAIS } from "~/contenus/anglais/textes-ecran-nouvelle-sortie";

export const TEXTES_ECRAN_NOUVELLE_SORTIE = {
  retour: "Retour",
  titre: "Nouvelle sortie",
  intro: "Tu proposes des lieux, la bande vote, et tout le monde se retrouve au bon endroit. Simple, non ?",
  nom: "Le nom",
  nomLibelle: "Le nom de la sortie",
  nomPlaceholder: "Resto de vendredi soir",
  caracteres: (n: number, max: number) => `${n}/${max} caractères`,
  quand: "Quand ?",
  avecQui: "Avec qui ?",
  ou: "Où ?",
  finVote: "Fin du vote",
  finVoteTexte: "Passé ce moment, le lieu qui a le plus de votes l'emporte.",
  unInstant: "Un instant…",
  creer: "Créer la sortie",
  creerIndice: "Tes potes invités pourront voter et discuter",
  proposerLieu: "Proposer un lieu",
  dansUneHeure: "Dans 1 h",
  ceSoir: "Ce soir, 18h",
  demainSoir: "Demain, 18h",
  avantSortie: "1 h avant la sortie",
  jusquaSortie: "Jusqu'à la sortie",
  aujourdhui: "Aujourd'hui",
  demain: "Demain",
  jourHeure: (jour: string, heure: string) => `${jour} à ${heure}`,
  erreurs: {
    quand: "Ce moment est déjà passé ou presque : laisse à la bande au moins un quart d'heure pour voter.",
    titreVide: "Donne un petit nom à ta sortie, même « Miam du vendredi » fait l'affaire.",
    titreLong: (max: number) => `${max} caractères au plus, fais court et gourmand.`,
    titreMot: "Un mot de ce titre ne passe pas chez nous. Tu reformules gentiment ?",
    invites: "Invite au moins un pote : une sortie tout seul, c'est un dîner aux chandelles avec toi-même.",
    lieux: "Propose au moins un lieu pour lancer le vote.",
    titreRefuse: (max: number) => `Ce titre ne passe pas : ${max} caractères au plus, et des mots gentils.`,
    participants: (max: number) => `Invite entre 1 et ${max} potes de ta bande.`,
    lieuxDisparus: "Les lieux choisis ne sont plus dans l'app : propose-en un autre.",
    horloge: (minSortie: number, minVote: number) =>
      `L'horloge coince : la sortie doit commencer au moins ${minSortie} min plus tard, et le vote finir au moins ${minVote} min plus tard, avant la sortie. Ajuste l'heure ou la fin du vote.`,
    trop: (max: number) => `${max} sorties à venir, c'est le maximum. Profite d'abord de celles-là, la prochaine t'attendra !`,
    reseau: "Le réseau a fait des siennes : ta sortie n'est pas partie. Réessaie dans un instant.",
  },
} as const;

export const TEXTES_ECRAN_NOUVELLE_SORTIE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_NOUVELLE_SORTIE>> = { fr: TEXTES_ECRAN_NOUVELLE_SORTIE, en: TEXTES_ECRAN_NOUVELLE_SORTIE_ANGLAIS };
