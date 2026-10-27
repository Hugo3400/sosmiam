import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_DEVENIR_AMBASSADEUR_ANGLAIS } from "~/contenus/anglais/devenir-ambassadeur";

export const TEXTES_DEVENIR_AMBASSADEUR = {
  badge: "🎖️ Programme Ambassadeurs",
  titre: "Deviens la voix de ton quartier",
  chapo: "Tu connais les pépites du coin avant tout le monde ? Fais-les découvrir : chaque lieu déniché te rapporte des points pour monter en grade.",
  blocs: { missions: "Ce que tu fais", avantages: "Ce que tu y gagnes" },
  ruban: "FONDATEUR",
  fondateurs: { fort: "Des fondateurs dans chaque ville", suite: " : 367 places, partout en France." },
  bouton: "Je deviens ambassadeur",
  conditions:
    "Dès 18 ans, sur ambassadeur.sosmiam.fr : crée ton compte, l'équipe le valide, et tu pourras candidater pour être fondateur de ta ville (ou de ton département), tant qu'il y reste des places.",
};

export const TEXTES_DEVENIR_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DEVENIR_AMBASSADEUR>> = {
  fr: TEXTES_DEVENIR_AMBASSADEUR,
  en: TEXTES_DEVENIR_AMBASSADEUR_ANGLAIS,
};
