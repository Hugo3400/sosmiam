import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_EN_TETE_ANGLAIS } from "~/contenus/anglais/liens-en-tete";
import type { EspaceDuLien } from "~/fonctions/hotes/creer-adresse-lien";

export type LienEnTete = {
  texte: string;
  adresse: string;
  site: EspaceDuLien;
  section?: string;
  detail: string;
};

export type GroupeEnTete = { titre: string; liens: LienEnTete[] };

export const TEXTES_EN_TETE = {
  liens: {
    app: { texte: "L'app", detail: "Comment ça marche, en quatre gestes" },
    lieux: { texte: "Les lieux", detail: "Des pépites qui méritent plus de monde" },
    actus: { texte: "Actus", detail: "Les lieux racontés par les ambassadeurs" },
    bigSos: { texte: "BIG SOS", detail: "Un coup dur ? La Brigade à la rescousse" },
    faq: { texte: "FAQ", detail: "Tes questions, même les plus farfelues" },
    ambassadeurs: { texte: "Ambassadeurs", detail: "Fais découvrir tes pépites, dès 18 ans" },
    pros: { texte: "Pros", detail: "Ton lieu sur SOS Miam, et c'est gratuit" },
    monCompte: { texte: "Mon compte", detail: "Un seul compte pour l'app et les espaces" },
  },
  groupes: { decouvrir: "Découvrir", rejoindre: "Rejoindre" },
  previensMoi: "Préviens-moi",
  accueil: "SOS Miam, accueil",
  menuPrincipal: "Menu principal",
  menu: "Menu",
  fermer: "Fermer",
  appBientot: "L'app arrive bientôt partout en France : on te fait signe ?",
  bandeauDeveloppement: "🛠️ L'app SOS Miam est en développement : elle arrive bientôt partout en France.",
  allerAuContenu: "Aller au contenu",
};

export const TEXTES_EN_TETE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_EN_TETE>> = {
  fr: TEXTES_EN_TETE,
  en: TEXTES_EN_TETE_ANGLAIS,
};
