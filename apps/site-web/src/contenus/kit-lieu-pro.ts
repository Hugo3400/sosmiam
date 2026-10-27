import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_KIT_LIEU_PRO_ANGLAIS } from "~/contenus/anglais/kit-lieu-pro";

export const TEXTES_KIT_LIEU_PRO = {
  meta: {
    titre: (nom: string) => `Kit média · ${nom}`,
    titreParDefaut: "Kit média",
    description: "Le kit média de ton lieu sur SOS Miam.",
  },
  page: "Kit média",
  chapo: "De quoi dire que ton lieu est sur SOS Miam : des visuels pour tes réseaux, des autocollants pour ta vitrine, des textes prêts à poster. Tout est gratuit.",
  toutLeKit: "Tout le kit d'un coup : les visuels, les autocollants, les logos, les textes et les règles, dans un seul fichier.",
  toutTelecharger: (poids: string | null) => `Tout télécharger${poids ? ` (ZIP, ${poids})` : " (ZIP)"}`,
  voirCharte: "Voir la charte Miam Safe",
  cartes: {
    onEstSur: { titre: "On est sur SOS Miam", texte: "La mascotte gourmande sur fond jaune : pour dire à tes clients qu'ils te retrouvent sur SOS Miam." },
    miamSafe: { titre: "Ici, on est Miam Safe", texte: "Pour dire que ton équipe a signé la charte, avec la phrase à dire au comptoir." },
    autocollantSosMiam: { titre: "Autocollant « On est sur SOS Miam »", texte: "Un rond jaune de 10 cm pour ta vitrine ou ta caisse." },
    autocollantMiamSafe: { titre: "Autocollant « Lieu Miam Safe »", texte: "Un rond noir de 10 cm, avec la phrase « Le Capitaine est là ? »." },
    memo: { titre: "Mémo d'équipe Miam Safe", texte: "La phrase, l'écran à reconnaître et les quatre gestes, en A5, pour l'arrière du comptoir." },
    logoClair: { titre: "Logo pour fond clair", texte: "Pour ton site, tes menus ou tes réseaux, sur un fond clair." },
    logoSombre: { titre: "Logo pour fond sombre", texte: "La même chose, « SOS » en crème, pour un fond sombre." },
  },
  aTonNom: {
    titre: "À ton nom, à imprimer",
    texte: "Avec le nom de ton lieu et un QR vers ta fiche : la page s'imprime telle quelle, ou s'enregistre en PDF pour l'imprimeur.",
    pages: {
      vitrine: { titre: "L'affiche de vitrine", texte: "En A4, A3 ou 40 × 60 cm, avec la pastille Miam Safe si tu as signé la charte." },
      chevalet: { titre: "Le chevalet de table", texte: "Deux faces A6 à plier, qui tiennent debout sur la table." },
      affichette: { titre: "L'affichette de table", texte: "Une seule face A6, à poser sur le comptoir." },
    },
    ouvrir: "Ouvrir et imprimer",
  },
  textes: {
    titre: "Des textes prêts à poster",
    texte: "Copie, adapte avec tes mots, et poste avec un visuel. Le lien mène à la fiche de ton lieu sur sosmiam.fr.",
  },
  regles: {
    titre: "Les règles du kit",
    texte: "Quelques règles pour que ça reste juste, pour tes clients comme pour les autres lieux.",
  },
  avantTitre: " : ",
  fichiers: {
    pdf: "Télécharger le PDF à imprimer",
    story: "Télécharger le PNG de la story",
    post: "Télécharger le PNG du post",
    png: "Télécharger le PNG",
  },
};

export const TEXTES_KIT_LIEU_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_KIT_LIEU_PRO>> = {
  fr: TEXTES_KIT_LIEU_PRO,
  en: TEXTES_KIT_LIEU_PRO_ANGLAIS,
};
