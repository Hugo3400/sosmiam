import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CONNEXION_EXTERNE } from "../connexion-externe.ts";

export const TEXTES_CONNEXION_EXTERNE_ANGLAIS: Traduction<typeof TEXTES_CONNEXION_EXTERNE> = {
  messages: {
    annule: "No worries, nothing's changed. You can try again whenever you like, or use your email instead.",
    expire: "Logging in took a little too long (10 minutes max). Start again – it's quick!",
    refuse: "Apple or Google couldn't confirm who you are. Try again in a moment, or use your email instead.",
    "deja-rattache": "Your SOS Miam account is already linked to a different Apple or Google account. Log in with that one, or with your email.",
    "email-manquant": "We need your email address to create your account (with Apple, a Hide My Email address works just fine). Allow it to be shared, then try again.",
    indisponible: "Oops, logging in with Apple or Google isn't responding right now. Try again in a moment, or use your email instead.",
    "trop-de-demandes": "Easy does it! Too many tries in a row – try again in a few minutes.",
    "autre-compte": "That's not the Apple or Google account linked to your SOS Miam account – start again with the right one.",
  },
  fournisseurs: { apple: "Continue with Apple", google: "Continue with Google" },
  autreCompte: "Log in with another account",
  separateur: "or with your email",
};
