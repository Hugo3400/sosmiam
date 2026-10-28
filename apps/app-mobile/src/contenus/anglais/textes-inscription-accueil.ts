import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_INSCRIPTION_ACCUEIL } from "~/contenus/textes-inscription-accueil";

export const TEXTES_INSCRIPTION_ACCUEIL_ANGLAIS: Traduction<typeof TEXTES_INSCRIPTION_ACCUEIL> = {
  passerLu: "Skip the intro",
  passer: "Skip",
  cEstParti: "Let's go",
  suivant: "Next",
  indiceCEstParti: "Starts your sign-up",
  indiceSuivant: "Shows the next slide",
  jeterUnOeilLu: "Just browsing, without an account",
  jeterUnOeilIndice: "Look around the feed, the map and places without signing up. You can create your account whenever you like.",
  jeterUnOeil: "👀 Just browsing",
  diapo: (numero: number, total: number) => `Slide ${numero} of ${total}`,
  retour: "Back",
  connexion: {
    apple: "Continue with Apple",
    google: "Continue with Google",
    email: "Continue with email",
  },
  unInstant: "Just a sec…",
  compteTitre: "Create your account",
  compteSousTitre: "So you can keep your rescues, favourite places and badges on all your devices.",
  sessionPerdue: "Your session has ended (logged out everywhere, or password changed). Your account's waiting for you – tap “Log in” just below.",
  dejaUnCompte: "Already have an account?",
  meConnecter: "Log in",
  pasToutDeSuiteLu: "Not now: just browsing, without an account",
  pasToutDeSuite: "Not now, just browsing 👀",
  accepterDebut: "By continuing, you accept the",
  conditions: "Terms of Use",
  accepterEt: "and the",
  confidentialite: "privacy policy",
};
