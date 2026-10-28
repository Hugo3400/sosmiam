import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_FIL } from "~/contenus/textes-fil";

export const TEXTES_FIL_ANGLAIS: Traduction<typeof TEXTES_FIL> = {
  compteCree: "Account created! Over to you 💛",
  pasInteresse: "Got it – we'll show you less like this 🙈",
  partage: (emoji: string, nom: string, quartier: string) => `${emoji} ${nom} (${quartier}) would love a few more faces! I found it on SOS Miam 🛟 https://sosmiam.fr`,
  ceLieuDebut: "This place",
  ceLieu: "this place",
  garde: (nom: string) => `🔖 ${nom} saved for later`,
  retireGardes: "Removed from your saved places",
  enTete: {
    onglets: {
      abonnements: { libelle: "Following", mini: "Following", lu: "Following" },
      tous: { libelle: "For you", lu: "For you" },
      sos: { libelle: "SOS tonight 🔥", court: "SOS 🔥", lu: "SOS tonight" },
    },
    ongletLu: (lu: string, position: number, total: number) => `${lu}, tab ${position} of ${total}`,
    rescoussesRestantes: (n: number) => `You've got ${n} rescue${n === 1 ? "" : "s"} left this week`,
    visiteLu: "Browsing without an account. Create your account",
    visiteIndice: "One minute, and rescues, likes and comments are all yours",
    visite: "👀 Browsing · ",
    creerCompte: "Create your account",
  },
  videSos: {
    titre: "All quiet tonight",
    texte: "No place has sent out an SOS yet. Keep your appetite warm – we'll let you know as soon as a table frees up near you.",
    bouton: "See all the places",
  },
  videAbonnements: {
    titre: "Your Following feed is having a nap 😴",
    texte: "Follow places and creators – their videos will land here.",
    personnes: "The people you follow don't post videos yet – their lists are waiting for you in Community.",
    retour: "Back to For you",
    indiceRetour: "Goes back to the feed with every place",
  },
  videPourToi: {
    horsLigneTitre: "No signal",
    titre: "The feed's still warming up",
    horsLigneTexte: "Can't load the feed right now. It'll be back as soon as your connection is!",
    texte: "Places are getting their first videos ready. In the meantime, you'll find them in Explore – go and say hello!",
    bouton: "See the places",
  },
  media: {
    sonOn: "Turn the sound on",
    sonOff: "Mute",
    avancer: "Skip forward 2 seconds",
    reculer: "Go back 2 seconds",
    avanceeVideo: "Video progress",
    secondesLues: (lues: number, total: number) => `${lues} second${lues === 1 ? "" : "s"} of ${total}`,
    photoSuivante: "Next photo",
    photoPrecedente: "Previous photo",
    photo: "Photo",
    positionPhoto: (actuelle: number, total: number) => `${actuelle} of ${total}`,
  },
  legende: {
    plus: "more",
    moins: "less",
    indiceReplier: "Collapses the caption",
    indiceDeplier: "Shows the whole caption",
  },
  auteur: {
    voirPage: (nom: string) => `See ${nom}'s page`,
    voirFiche: (nom: string) => `See ${nom}'s page`,
  },
};
