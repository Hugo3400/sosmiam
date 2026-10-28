import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_INVITE_ANGLAIS } from "~/contenus/anglais/textes-invite";

export const TEXTES_INVITE = {
  avantages: ["Sauve des lieux et gagne des points", "Retrouve tes potes et organisez vos sorties", "Garde tes lieux préférés et donne ton avis"],
  jeMInscris: "Je m'inscris (1 min)",
  indiceInscrire: "Ouvre l'inscription : Apple, Google ou ton e-mail",
  indiceInscrirePour: (action: string) => `Ouvre l'inscription pour ${action}`,
  indicePlusTard: "Tu continues ta visite sans compte",
  plusTard: "Plus tard",
  enAttendant: "En attendant, le fil « Pour toi » et Explorer restent grands ouverts : régale tes yeux !",
  fermerLu: "Fermer, et continuer sans compte",
  invitationTitre: (pseudo: string) => `@${pseudo} t'invite dans sa bande !`,
  invitationTitreSansPseudo: "Une invitation t'attend !",
  invitationSousTitre: "Pour la rejoindre, il te faut un compte SOS Miam (gratuit, une minute).",
  invitationTexte: "Crée ton compte : juste après, on t'emmène rejoindre sa bande, sans retaper le lien.",
  creerMonCompte: "Créer mon compte",
};

export const TEXTES_INVITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INVITE>> = { fr: TEXTES_INVITE, en: TEXTES_INVITE_ANGLAIS };
