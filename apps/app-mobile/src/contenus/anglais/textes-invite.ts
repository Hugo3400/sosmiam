import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_INVITE } from "~/contenus/textes-invite";

export const TEXTES_INVITE_ANGLAIS: Traduction<typeof TEXTES_INVITE> = {
  avantages: ["Rescue places and earn points", "Find your friends and plan get-togethers", "Save your favourite places and share your reviews"],
  jeMInscris: "Sign me up (1 min)",
  indiceInscrire: "Opens sign-up: Apple, Google or your email",
  indiceInscrirePour: (action: string) => `Opens sign-up to ${action}`,
  indicePlusTard: "You'll keep browsing without an account",
  plusTard: "Not now",
  enAttendant: "In the meantime, the For you feed and Explore are wide open – feast your eyes!",
  fermerLu: "Close and carry on without an account",
  invitationTitre: (pseudo: string) => `@${pseudo} has invited you to their crew!`,
  invitationTitreSansPseudo: "An invitation's waiting for you!",
  invitationSousTitre: "To join, you'll need an SOS Miam account (free, and it only takes a minute).",
  invitationTexte: "Create your account and we'll take you straight to their crew, no need to retype the link.",
  creerMonCompte: "Create my account",
};
