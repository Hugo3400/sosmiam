import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_AUCUN_LIEU_ANGLAIS } from "~/contenus/anglais/aucun-lieu";

export const TEXTES_AUCUN_LIEU = {
  titre: {
    indisponible: "Les lieux font une petite pause",
    vide: "Les premières pépites arrivent",
  },
  texte: {
    indisponible: "Impossible d'afficher les lieux pour le moment. Reviens dans un instant !",
    vide: "Aucun lieu n'est encore publié : les premiers restos, bars et pâtisseries (et quelques sorties) arrivent avec le lancement, partout en France. Ici, que du vrai : pas de faux lieux pour faire joli.",
  },
  previensMoi: "Préviens-moi au lancement",
  proposer: "Proposer une pépite",
  courriel: {
    objet: "Je propose un lieu à SOS Miam",
    texte: "Salut l'équipe SOS Miam !\n\nNom du lieu : \nVille et quartier : \nPourquoi il mérite plus de monde : \n",
  },
};

export const TEXTES_AUCUN_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_AUCUN_LIEU>> = {
  fr: TEXTES_AUCUN_LIEU,
  en: TEXTES_AUCUN_LIEU_ANGLAIS,
};
