import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_BLOCS_MON_LIEU_ANGLAIS } from "~/contenus/anglais/textes-blocs-mon-lieu";

export const TEXTES_BLOCS_MON_LIEU = {
  fidelite: {
    taRecompense: "ta récompense",
    apercuLu: (visites: number, recompense: string, actif: boolean) =>
      `Aperçu de la carte : ${visites} visites pour ${recompense}${actif ? "" : ". En pause : tes clients ne la voient pas"}`,
    apercu: "Aperçu",
    apres: (visites: number, recompense: string) => `Après ${visites} visites : ${recompense}.`,
    enPause: "En pause : tes clients ne la voient pas.",
  },
  ligne: {
    bientot: "Bientôt",
  },
  statistique: {
    pareil: "pareil que la semaine dernière",
    plus: (ecart: number) => `${ecart} de plus que la semaine dernière`,
    moins: (ecart: number) => `${ecart} de moins que la semaine dernière`,
    lu: (libelle: string, valeur: number, tendance: string) => `${libelle} : ${valeur} cette semaine, ${tendance}`,
  },
  charte: {
    engagementsTitre: "Ce que ton équipe s'engage à faire",
    chargement: "On lit ta charte…",
    erreur: "Oups, la charte ne s'est pas affichée.",
    reessayer: "Réessayer",
    signee: "Ton lieu a signé la charte Miam Safe.",
    signeeLe: (date: string) => `Ton lieu a signé la charte Miam Safe le ${date}.`,
    retiree: (adresse: string) => `L'équipe SOS Miam a retiré la charte de ton lieu après un signalement. Écris-nous à ${adresse} pour en parler.`,
    nousEcrire: "Nous écrire",
    nousEcrireIndice: (adresse: string) => `Ouvre un e-mail vers ${adresse}`,
    pasSignee: "Ton lieu n'a pas encore signé la charte. Le badge Miam Safe sur ta fiche, c'est gratuit.",
  },
};

export const TEXTES_BLOCS_MON_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_BLOCS_MON_LIEU>> = { fr: TEXTES_BLOCS_MON_LIEU, en: TEXTES_BLOCS_MON_LIEU_ANGLAIS };
