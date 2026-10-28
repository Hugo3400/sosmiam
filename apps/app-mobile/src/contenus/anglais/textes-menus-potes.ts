import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MENUS_POTES } from "~/contenus/textes-menus-potes";

export const TEXTES_MENUS_POTES_ANGLAIS: Traduction<typeof TEXTES_MENUS_POTES> = {
  recommandation: {
    titre: (prenom: string) => `Place sent by ${prenom}`,
    signaler: "Report this shared place",
    detail: "Hidden ad, scam, hurtful words… it disappears for you",
    sujet: (prenom: string) => `the place sent by ${prenom}`,
  },
  liste: {
    titre: (prenom: string) => `${prenom}'s list`,
    signaler: "Report this list",
    detail: "Offensive title, scam, hidden ad… it disappears for you",
    sujet: (prenom: string) => `${prenom}'s list`,
  },
  contenu: {
    voirProfil: (prenom: string) => `See ${prenom}'s profile`,
    signalerProfil: (prenom: string) => `Report ${prenom}`,
    signalerProfilDetail: "Something wrong with their profile? We'll take a close look",
    bloquerDetail: "Their messages, the places they've sent and their lists disappear for you",
    sujetProfil: (prenom: string) => `${prenom}'s profile`,
    bloquerDansBande: (prenom: string) => `${prenom} will leave your crew, and you won't see their messages, comments, sent places or lists any more.`,
    bloquerHorsBande: "You won't see their messages, comments, sent places or lists any more. You get some peace and quiet – that's all that matters.",
  },
  message: {
    cettePersonne: "this person",
    signaler: "Report this message",
    signalerDetail: "Insults, harassment, scams… tell us what's wrong",
    bloquerDetail: "You won't see their messages or comments any more",
    sujet: (prenom: string) => `this message from ${prenom}`,
    bloquerDansBande: (prenom: string) => `${prenom} will leave your crew, and their messages and comments will disappear for you. You get some peace and quiet – that's all that matters.`,
    bloquerHorsBande: "Their messages and comments will disappear for you. You get some peace and quiet – that's all that matters.",
    titre: (prenom: string) => `Message from ${prenom}`,
  },
  bloquer: (prenom: string) => `Block ${prenom}`,
  bloquerTitre: (prenom: string) => `Block ${prenom}?`,
  nonJeReviens: "No, take me back",
  fermerMenu: "Close the menu",
  annuler: "Cancel",
};
