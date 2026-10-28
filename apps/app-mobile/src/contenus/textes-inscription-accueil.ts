import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_INSCRIPTION_ACCUEIL_ANGLAIS } from "~/contenus/anglais/textes-inscription-accueil";

export const TEXTES_INSCRIPTION_ACCUEIL = {
  passerLu: "Passer la présentation",
  passer: "Passer",
  cEstParti: "C'est parti",
  suivant: "Suivant",
  indiceCEstParti: "Commence ton inscription",
  indiceSuivant: "Affiche la diapo suivante",
  jeterUnOeilLu: "Juste jeter un œil, sans compte",
  jeterUnOeilIndice: "Regarde le fil, la carte et les lieux sans t'inscrire. Tu créeras ton compte quand tu voudras.",
  jeterUnOeil: "👀 Juste jeter un œil",
  diapo: (numero: number, total: number) => `Diapo ${numero} sur ${total}`,
  retour: "Retour",
  connexion: {
    apple: "Continuer avec Apple",
    google: "Continuer avec Google",
    email: "Continuer avec mon e-mail",
  },
  unInstant: "Un instant…",
  compteTitre: "Crée ton compte",
  compteSousTitre: "Pour garder tes rescousses, tes lieux préférés et tes badges, sur tous tes appareils.",
  sessionPerdue: "Ta session a pris fin (déconnecté partout, ou mot de passe changé). Ton compte t'attend : touche « Me connecter » juste en dessous.",
  dejaUnCompte: "Déjà un compte ?",
  meConnecter: "Me connecter",
  pasToutDeSuiteLu: "Pas tout de suite : juste jeter un œil, sans compte",
  pasToutDeSuite: "Pas tout de suite, juste jeter un œil 👀",
  accepterDebut: "En continuant, tu acceptes les",
  conditions: "conditions d'utilisation",
  accepterEt: "et la",
  confidentialite: "politique de confidentialité",
};

export const TEXTES_INSCRIPTION_ACCUEIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INSCRIPTION_ACCUEIL>> = {
  fr: TEXTES_INSCRIPTION_ACCUEIL,
  en: TEXTES_INSCRIPTION_ACCUEIL_ANGLAIS,
};
