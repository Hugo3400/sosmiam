import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_IMPRIMES_PRO_ANGLAIS } from "~/contenus/anglais/imprimes-pro";

export const TEXTES_IMPRIMES_PRO = {
  qr: "Le QR mène à ta fiche publique : rien à mettre à jour, même si tes horaires changent.",
  nonPubliee: "Ta fiche n'est pas encore publiée : le QR marchera dès qu'elle le sera.",
  enFrancais: "",
  affichette: {
    meta: {
      titre: (nom: string) => `Affichette · ${nom}`,
      titreParDefaut: "Affichette",
      description: "L'affichette de table de ton lieu.",
    },
    page: "Mon affichette",
    chapo: "À poser sur les tables ou le comptoir : un scan, et tes clients retrouvent ta fiche.",
    conseils: [
      "Format A6 (105 × 148 mm) : une carte postale.",
      "Sur une feuille A4, coche « Taille réelle » (ou 100 %) et découpe.",
    ],
  },
  vitrine: {
    meta: {
      titre: (nom: string) => `Affiche de vitrine · ${nom}`,
      titreParDefaut: "Affiche de vitrine",
      description: "L'affiche de vitrine de ton lieu.",
    },
    page: "Mon affiche de vitrine",
    chapo: "Pour ta vitrine ou ta salle : ton nom en grand, et un QR vers ta fiche.",
    format: "Format",
    conseils: {
      a4: "Sur une imprimante de bureau, en « Taille réelle » (ou 100 %).",
      a3: "Chez l'imprimeur, ou sur une imprimante A3 : enregistre d'abord la page en PDF.",
      "40x60": "Chez l'imprimeur : enregistre la page en PDF (« Enregistrer au format PDF ») et apporte-le.",
    },
    miamSafeSignee: "Ta charte Miam Safe est signée : la pastille « Lieu Miam Safe » est en bas.",
    miamSafeNonSignee: "Signe la charte Miam Safe pour ajouter la pastille « Lieu Miam Safe ».",
    imprimer: "Imprimer l'affiche",
  },
  chevalet: {
    meta: {
      titre: (nom: string) => `Chevalet de table · ${nom}`,
      titreParDefaut: "Chevalet de table",
      description: "Le chevalet de table de ton lieu.",
    },
    page: "Mon chevalet de table",
    chapo: "Deux faces à plier, qui tiennent debout sur la table : un scan, et tes clients retrouvent ta fiche.",
    conseils: [
      "Sur une feuille A4, en « Taille réelle » (ou 100 %) : découpe le rectangle de 210 × 148 mm.",
      "Plie sur les pointillés, faces vers l'extérieur : un papier épais (250 g) tient mieux debout.",
    ],
    imprimer: "Imprimer le chevalet",
  },
  imprimer: {
    affichette: "Imprimer l'affichette",
    sansJavascript: "Pour l'imprimer : menu « Imprimer » de ton navigateur (Ctrl + P, ou ⌘ + P sur Mac).",
  },
};

export const TEXTES_IMPRIMES_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_IMPRIMES_PRO>> = {
  fr: TEXTES_IMPRIMES_PRO,
  en: TEXTES_IMPRIMES_PRO_ANGLAIS,
};
