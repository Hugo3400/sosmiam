import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CONNEXION_COMPTE_ANGLAIS } from "~/contenus/anglais/connexion-compte";

export const TEXTES_CONNEXION_COMPTE = {
  titre: "Connexion",
  titreDeconnexion: "Déconnexion — SOS Miam",
  espaces: {
    ambassadeur: {
      description: "Connecte-toi à ton espace ambassadeur SOS Miam.",
      chapo: "Content de te revoir ! Connecte-toi pour retrouver ton espace ambassadeur.",
      inscription: "Deviens ambassadeur",
    },
    pro: {
      description: "Connecte-toi à l'espace pro SOS Miam : ta fiche, ton équipe, ton affichette.",
      chapo: "Content de te revoir ! Connecte-toi pour retrouver ton lieu.",
      inscription: "Crée ton compte",
    },
  },
  accueils: {
    "au-revoir": "Ton compte est effacé. Merci d'avoir fait un bout de chemin avec SOS Miam !",
    deconnecte: "Tu es déconnecté. À bientôt !",
  },
  pasEncoreDeCompte: "Pas encore de compte ? ",
  motDePasseOublie: "Mot de passe oublié ?",
  seConnecter: "Se connecter",
  connexionEnCours: "Connexion…",
  indiqueEmail: "Indique ton e-mail.",
  indiqueMotDePasse: "Indique ton mot de passe.",
  pasMarche: "Oups, la connexion n'a pas marché. Réessaie dans un instant.",
  identifiants: "E-mail ou mot de passe incorrect.",
};

export const TEXTES_CONNEXION_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CONNEXION_COMPTE>> = {
  fr: TEXTES_CONNEXION_COMPTE,
  en: TEXTES_CONNEXION_COMPTE_ANGLAIS,
};
