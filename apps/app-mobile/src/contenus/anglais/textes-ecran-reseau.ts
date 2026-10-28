import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_RESEAU } from "~/contenus/textes-ecran-reseau";

export const TEXTES_ECRAN_RESEAU_ANGLAIS: Traduction<typeof TEXTES_ECRAN_RESEAU> = {
  noms: {
    abonnes: { un: "follower", des: "followers" },
    abonnements: { un: "account", des: "accounts" },
  },
  inviteTitre: "Followers and following",
  inviteTexte: "Create your account to follow people and see who follows who. It's free, and it takes a minute.",
  inscription: "Sign me up (1 min)",
  inscriptionIndice: "Opens sign-up",
  introuvableTitre: "Nobody on the horizon",
  introuvableTexte: "We can't find this profile. The person may have left SOS Miam, or the link got in a tangle.",
  retour: "Back",
  toi: "You",
  ouvrirTonProfil: "Opens your profile",
  ouvrirSonProfil: "Opens their profile",
  demandesLues: (n: number) => `Follow requests, ${n}`,
  demandesIndice: "Opens your notifications so you can accept or decline them",
  demandes: (n: number) => `Follow requests (${n})`,
  neTeSuitPlus: "No longer follows you",
  personneNeTeSuit: "Nobody follows you yet… Share your profile – your friends can add you with your QR code.",
  lectureRatee: "The network's playing up – we can't load this list right now. Try again in a moment!",
  chargement: "Loading the list",
  aucunAbonne: (prenom: string) => `${prenom} doesn't have any followers yet. The first spot's up for grabs!`,
  suitPersonne: (prenom: string) => `${prenom} isn't following anyone yet.`,
};
