import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_BLOCS_MON_LIEU } from "~/contenus/textes-blocs-mon-lieu";

const visits = (n: number) => `${n} visit${n === 1 ? "" : "s"}`;

export const TEXTES_BLOCS_MON_LIEU_ANGLAIS: Traduction<typeof TEXTES_BLOCS_MON_LIEU> = {
  fidelite: {
    taRecompense: "your reward",
    apercuLu: (visites: number, recompense: string, actif: boolean) =>
      `Card preview: ${visits(visites)} for ${recompense}${actif ? "" : ". Paused: your customers can't see it"}`,
    apercu: "Preview",
    apres: (visites: number, recompense: string) => `After ${visits(visites)}: ${recompense}.`,
    enPause: "Paused: your customers can't see it.",
  },
  ligne: {
    bientot: "Coming soon",
  },
  statistique: {
    pareil: "same as last week",
    plus: (ecart: number) => `${ecart} more than last week`,
    moins: (ecart: number) => `${ecart} fewer than last week`,
    lu: (libelle: string, valeur: number, tendance: string) => `${libelle}: ${valeur} this week, ${tendance}`,
  },
  charte: {
    engagementsTitre: "What your team commits to",
    chargement: "Loading your charter…",
    erreur: "Oops, the charter didn't load.",
    reessayer: "Try again",
    signee: "Your venue has signed the Miam Safe charter.",
    signeeLe: (date: string) => `Your venue signed the Miam Safe charter on ${date}.`,
    retiree: (adresse: string) => `The SOS Miam team has withdrawn your venue's charter after a report. Drop us a line at ${adresse} to talk it through.`,
    nousEcrire: "Drop us a line",
    nousEcrireIndice: (adresse: string) => `Opens an email to ${adresse}`,
    pasSignee: "Your venue hasn't signed the charter yet. The Miam Safe badge on your listing is free.",
  },
};
