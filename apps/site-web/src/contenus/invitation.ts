import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_INVITATION_ANGLAIS } from "~/contenus/anglais/invitation";

export const TEXTES_INVITATION = {
  meta: {
    titre: (pseudo: string) => `Rejoins la bande de @${pseudo} — SOS Miam`,
    introuvable: "Invitation introuvable — SOS Miam",
    description: "Ouvre SOS Miam pour rejoindre sa bande et sauver des tables ensemble.",
  },
  titre: (pseudo: string) => `Ouvre SOS Miam pour rejoindre la bande de @${pseudo}`,
  chapo: "Une bande, c'est des potes qui sauvent des tables ensemble. Il ne manque plus que toi à bord.",
  ouvrirApp: "Ouvrir l'app",
  pasEncore: "Pas encore l'app ? Elle est en développement et arrive bientôt sur les stores. Garde ce lien bien au chaud : il marchera dès qu'elle sera là.",
  bientot: (store: string) => `${store} : bientôt`,
  introuvable: {
    titre: "Invitation introuvable",
    chapo: "Ce lien d'invitation a dû prendre l'eau en chemin. Demande à ton pote de te le renvoyer, ou de te montrer son QR code dans l'app.",
  },
  decouvrir: "Découvrir SOS Miam",
};

export const TEXTES_INVITATION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INVITATION>> = {
  fr: TEXTES_INVITATION,
  en: TEXTES_INVITATION_ANGLAIS,
};
