import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_CONFIDENTIALITE } from "~/contenus/textes-reglages-confidentialite";

export const TEXTES_REGLAGES_CONFIDENTIALITE_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_CONFIDENTIALITE> = {
  annoncePrive: "🔒 Your account is private. Your followers stay; new ones will have to knock first.",
  annoncePublic: "🔓 Your account is public: anyone can follow you without asking.",
  annonceRatee: "That didn't work this time, so your account hasn't changed. Try again in a moment.",
  demandes: (nombre: number) => (nombre === 1 ? "The pending request will be accepted." : `The ${nombre} pending requests will be accepted.`),
  publicAvecDemandes: (acceptees: number) =>
    `🔓 Your account is public. ${acceptees === 1 ? "1 request accepted" : `${acceptees} requests accepted`} – say hello to your new followers!`,
  titreAvecBande: "Privacy",
  titreSansBande: "Private account",
  sousTitreAvecBande: "Who can follow you, who can find you, and what your crew sees.",
  sousTitreSansBande: "Who can follow you, and what people who don't follow you can see.",
  chargement: "Loading your settings",
  comptePrive: "Private account",
  comptePriveDetail: "Every new follower will have to ask you",
  explicationCompte:
    "When you're private, people who don't follow you only see your avatar, your first name, your @username and your counts. Your followers see your lists and your badges, and your crew sees everything.",
  explicationTelephone:
    "When you're private, people who don't follow you only see your avatar, your first name, your @username and your counts. Your followers see everything, and so does your crew, if you added each other for real (link or QR code).",
  passerPrive: "Going private doesn't kick anyone out: your followers stay. And if you go public again, pending requests will be accepted.",
  feuilleTitre: "Make your account public?",
  feuilleDetail: (demandes: string) => `Anyone will be able to follow you without asking. ${demandes}`,
  passerPublic: "Go public",
  resterPrive: "I'll stay private",
  resterPriveIndice: "Your account stays private and the requests wait",
  bande: {
    titre: "Your crew",
    intro: "Who can find you, and what your friends see of you.",
    chargement: "Loading your crew settings",
    interrupteurs: {
      trouvable: { titre: "Let people find me by username", detail: "When it's off, people can only join your crew through your link or QR code." },
      suggerable: { titre: "Suggest me to others", detail: "We can suggest you to your friends' friends." },
      activitePartagee: {
        titre: "Show my activity to my crew",
        detail: "Your rescues, your saved places and your badges, in Crew news and the leaderboard.",
      },
      pushSocial: {
        titre: "Notifications from my crew",
        detail:
          "Messages, get-togethers and new friends, on your phone. When it's off, nothing from your crew comes through, messages included – you'll find everything when you open the app. The only exception: a friend alerting you with Miam Safe always gets through.",
      },
    },
  },
};
