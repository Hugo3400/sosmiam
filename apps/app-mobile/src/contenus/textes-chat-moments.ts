import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CHAT_MOMENTS_ANGLAIS } from "~/contenus/anglais/textes-chat-moments";

export const TEXTES_CHAT_MOMENTS = {
  leMoment: (moment: string) => (/^\d/.test(moment) ? `le ${moment}` : moment),
  envoyeVu: (moment: string, heure: string) => `Envoyé ${moment} · ${heure}`,
  envoyeLu: (moment: string, heure: string) => `Envoyé ${moment}, à ${heure}`,
  momentVu: (moment: string, heure: string) => `${moment} · ${heure}`,
  momentLu: (moment: string, heure: string) => `${moment}, à ${heure}`,
  envoye: "Envoyé",
  envoyeDepuisVu: (moment: string) => `Envoyé · ${moment}`,
  envoyeDepuisLu: (moment: string) => `Envoyé ${moment}`,
  vu: "Vu",
  vuPar: (qui: string) => `Vu par ${qui}`,
  vuParPersonnes: (n: number) => `Vu par ${n} personne${n > 1 ? "s" : ""}`,
  aujourdhui: "Aujourd'hui",
  hier: "Hier",
  finDans1h: "Dans 1 h",
  finDans3h: "Dans 3 h",
  finCeSoir: "Ce soir 19 h",
  finA: (heure: string) => `à ${heure}`,
  finDemain: (heure: string) => `demain à ${heure}`,
  finJour: (jour: string, heure: string) => `${jour} à ${heure}`,
  votes: (votants: number, total: number) => `${votants} vote${votants > 1 ? "s" : ""} sur ${total}`,
  voteFiniPersonne: "Vote fini : personne n'a voté",
  voteFini: (votes: string) => `Vote fini · ${votes}`,
  toutLeMonde: "Tout le monde a voté",
  finDuVote: (quand: string) => `fin du vote ${quand}`,
} as const;

export const TEXTES_CHAT_MOMENTS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHAT_MOMENTS>> = { fr: TEXTES_CHAT_MOMENTS, en: TEXTES_CHAT_MOMENTS_ANGLAIS };
