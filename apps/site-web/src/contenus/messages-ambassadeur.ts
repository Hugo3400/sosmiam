import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MESSAGES_AMBASSADEUR_ANGLAIS } from "~/contenus/anglais/messages-ambassadeur";

export const TEXTES_MESSAGES_AMBASSADEUR = {
  meta: { titre: "Mes messages", description: "Les messages de l'équipe SOS Miam." },
  titre: "Mes messages",
  chapo: "Les nouvelles de l'équipe SOS Miam.",
  nonLus: (nombre: number) => ` ${nombre} non lu${nombre > 1 ? "s" : ""}.`,
  aucun: "Aucun message pour l'instant. Quand l'équipe t'écrit, c'est ici que ça arrive.",
  reponses: {
    lu: "C'est noté : message marqué comme lu.",
    introuvable: "Ce message n'existe plus.",
    panne: "Oups, ça n'a pas marché. Réessaie dans un instant.",
  },
  carte: {
    nouveau: "Nouveau",
    recuLe: "Reçu le ",
    luLe: "Lu le ",
    marquer: "Marquer comme lu",
    pourLecteurs: (titre: string) => ` : ${titre}`,
  },
};

export const TEXTES_MESSAGES_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MESSAGES_AMBASSADEUR>> = {
  fr: TEXTES_MESSAGES_AMBASSADEUR,
  en: TEXTES_MESSAGES_AMBASSADEUR_ANGLAIS,
};
