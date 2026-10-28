import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MIAM_SAFE_RACONTER_ANGLAIS } from "~/contenus/anglais/textes-miam-safe-raconter";

export const TEXTES_MIAM_SAFE_RACONTER = {
  merci: "Merci de nous l'avoir dit.",
  lecture: (heures: number) => `Notre équipe le lit sous ${heures} h et te dira ce qu'elle a décidé. Rien n'apparaît sur la fiche du lieu.`,
  intro: (chezLieu: string) => `Ce qui s'est passé ${chezLieu}. Ça reste entre toi et notre équipe.`,
  avecTesMots: "Avec tes mots",
  facultatif: "facultatif",
  envoyer: "Envoyer à l'équipe",
  indiceRaison: "Choisis d'abord ce qui s'est passé",
  indiceTexte: "Raconte en quelques mots ce qui s'est passé",
  visitePasEncoreVue: "Elle ne compte qu'après une visite validée dans ce lieu, et on ne trouve pas encore la tienne de notre côté : rien n'est parti.",
  merciReponse: "Merci pour ta réponse.",
  merciCompte: (nomLieu: string) => `Merci, ça compte pour ${nomLieu}.`,
  question: "Tu t'es senti·e bien ici ?",
  desole: "Désolé·e. Rien ne s'affiche sur la fiche : si tu veux, raconte-nous ce qui s'est passé.",
  oui: "Oui",
  pasVraiment: "Pas vraiment",
  pasVraimentIndice: "Ça ne s'affiche jamais sur la fiche du lieu",
};

export const TEXTES_MIAM_SAFE_RACONTER_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MIAM_SAFE_RACONTER>> = { fr: TEXTES_MIAM_SAFE_RACONTER, en: TEXTES_MIAM_SAFE_RACONTER_ANGLAIS };
