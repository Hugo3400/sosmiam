import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CONNEXION_COMPTE } from "~/contenus/connexion-compte";

export const TEXTES_CONNEXION_COMPTE_ANGLAIS: Traduction<typeof TEXTES_CONNEXION_COMPTE> = {
  titre: "Log in",
  titreDeconnexion: "Log out — SOS Miam",
  espaces: {
    ambassadeur: {
      description: "Log in to your SOS Miam ambassador area.",
      chapo: "Good to see you again! Log in to get back to your ambassador area.",
      inscription: "Become an ambassador",
    },
    pro: {
      description: "Log in to the SOS Miam Pro area: your listing, your team, your poster.",
      chapo: "Good to see you again! Log in to get back to your venue.",
      inscription: "Create your account",
    },
  },
  accueils: {
    "au-revoir": "Your account has been deleted. Thanks for spending some time with SOS Miam!",
    deconnecte: "You're logged out. See you soon!",
  },
  pasEncoreDeCompte: "No account yet? ",
  motDePasseOublie: "Forgotten your password?",
  seConnecter: "Log in",
  connexionEnCours: "Logging in…",
  indiqueEmail: "Enter your email.",
  indiqueMotDePasse: "Enter your password.",
  pasMarche: "Oops, logging in didn't work. Try again in a moment.",
  identifiants: "Incorrect email or password.",
};
