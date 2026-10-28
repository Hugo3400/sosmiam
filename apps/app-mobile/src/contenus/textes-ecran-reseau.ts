import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_RESEAU_ANGLAIS } from "~/contenus/anglais/textes-ecran-reseau";

export const TEXTES_ECRAN_RESEAU = {
  noms: {
    abonnes: { un: "abonné", des: "abonnés" },
    abonnements: { un: "abonnement", des: "abonnements" },
  },
  inviteTitre: "Abonnés et abonnements",
  inviteTexte: "Crée ton compte pour suivre des gens et voir qui suit qui. C'est gratuit, et ça prend une minute.",
  inscription: "Je m'inscris (1 min)",
  inscriptionIndice: "Ouvre l'inscription",
  introuvableTitre: "Personne à l'horizon",
  introuvableTexte: "On ne trouve pas ce profil : la personne a peut-être quitté SOS Miam, ou le lien s'est emmêlé.",
  retour: "Retour",
  toi: "Toi",
  ouvrirTonProfil: "Ouvre ton profil",
  ouvrirSonProfil: "Ouvre son profil",
  demandesLues: (n: number) => `Demandes d'abonnement, ${n}`,
  demandesIndice: "Ouvre tes notifications pour les accepter ou les refuser",
  demandes: (n: number) => `Demandes d'abonnement (${n})`,
  neTeSuitPlus: "Ne te suit plus",
  personneNeTeSuit: "Personne ne te suit encore… Partage ton profil : tes potes t'ajoutent avec ton QR code.",
  lectureRatee: "Le réseau fait des siennes : impossible de lire cette liste pour l'instant. Réessaie dans un instant !",
  chargement: "Chargement de la liste",
  aucunAbonne: (prenom: string) => `${prenom} n'a pas encore d'abonnés. La première place est libre !`,
  suitPersonne: (prenom: string) => `${prenom} ne suit personne pour l'instant.`,
} as const;

export const TEXTES_ECRAN_RESEAU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_RESEAU>> = { fr: TEXTES_ECRAN_RESEAU, en: TEXTES_ECRAN_RESEAU_ANGLAIS };
