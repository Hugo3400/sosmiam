import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_AVIS_LIEU_ANGLAIS } from "~/contenus/anglais/textes-avis-lieu";

export const TEXTES_AVIS_LIEU = {
  titre: "Les avis des Miamis",
  chargement: "On va chercher les avis…",
  resumeMoyenne: "{moyenne} sur 5",
  resumeUnAvis: "1 avis",
  resumeAvis: "{nombre} avis",
  resumeRetour: "{part} % des clients reviennent",
  resumeLu: "Note de {moyenne} sur 5, sur {nombre}",
  prudence: "Une moyenne prudente : ni 5 sur 5 grâce à un seul pote, ni coulée par une seule mauvaise soirée.",
  videTitre: "Pas encore d'avis ici",
  videTexte: "Le premier Miami qui passe ouvre le bal. Ce sera peut-être toi ?",
  erreurTitre: "Les avis n'ont pas pu arriver",
  erreurTexte: "Le réseau fait des siennes. Ils t'attendent bien au chaud : réessaie dans un instant.",
  reessayer: "Réessayer",
  voirPlus: "Voir plus d'avis",
  voirPlusEnCours: "On en cherche d'autres…",
  voirPlusIndice: "Affiche les avis suivants, du plus récent au plus ancien",
} as const;

export const TEXTES_AVIS_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_AVIS_LIEU>> = { fr: TEXTES_AVIS_LIEU, en: TEXTES_AVIS_LIEU_ANGLAIS };
