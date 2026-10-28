import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MISE_A_JOUR_ANGLAIS } from "~/contenus/anglais/textes-mise-a-jour";

export const TEXTES_MISE_A_JOUR = {
  obligatoire: {
    surtitre: "Escale au port",
    titre: "Ta version de SOS Miam a pris un coup de vieux",
    texte: "Mets-la à jour pour continuer : quelques secondes, et la Brigade t'attend à bord.",
    bouton: "Mettre à jour",
    versionInstallee: "Ta version : {version}",
    annonceLecteurEcran: "Mise à jour nécessaire pour continuer sur SOS Miam",
  },
  nouvelle: {
    surtitre: "Du nouveau à bord",
    titre: "Une nouvelle version t'attend !",
    texte: "Le Capitaine a briqué le pont : nouveautés et petites réparations à bord.",
    bouton: "Mettre à jour",
    plusTard: "Plus tard",
    indicePlusTard: "Ferme la fenêtre, on ne te reparlera pas de cette version",
    fermerFond: "Fermer, plus tard",
    annonceLecteurEcran: "Une nouvelle version de SOS Miam est disponible",
  },
  indiceStore: "Ouvre SOS Miam sur {store}",
  storeRate: "Oups, {store} n'a pas répondu à l'appel. Cherche « SOS Miam » dedans, on t'attend à bord !",
  stores: { ios: "l'App Store", android: "Google Play", autre: "le store de ton téléphone" },
  apercus: {
    titreSection: "Mises à jour de l'app",
    obligatoire: "Voir l'écran de mise à jour obligatoire",
    detailObligatoire: "Celui qui bloque l'app quand ta version est trop ancienne",
    nouvelle: "Voir la proposition de nouvelle version",
    detailNouvelle: "La fenêtre douce, avec « Mettre à jour » et « Plus tard »",
  },
} as const;

export const TEXTES_MISE_A_JOUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MISE_A_JOUR>> = { fr: TEXTES_MISE_A_JOUR, en: TEXTES_MISE_A_JOUR_ANGLAIS };
