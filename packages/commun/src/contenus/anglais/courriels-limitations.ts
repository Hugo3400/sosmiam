import type { Traduction } from "../../types/traduction.ts";
import type { TEXTES_COURRIELS_LIMITATIONS } from "../courriels-limitations.ts";

export const TEXTES_COURRIELS_LIMITATIONS_ANGLAIS: Traduction<typeof TEXTES_COURRIELS_LIMITATIONS> = {
  pied: "You're getting this email because the SOS Miam team has made a decision about your account. Got a question? Just reply to this email.",
  ceQuiChange:
    "While it lasts, you can't post anything other people can see (messages, comments, reviews, outings, lists, invitations, a new username or avatar). Reading, getting visits confirmed, Miam Safe, reporting, blocking, your settings, exporting your data and deleting your account all work as usual.",
  motifs: {
    "fausse-info": "false information",
    "pub-cachee": "hidden advertising",
    arnaque: "a scam",
    haine: "hateful content",
    violence: "violence",
    danger: "putting people at risk",
    "vie-privee": "invasion of privacy",
    droits: "copyright",
    triche: "cheating",
    usurpation: "impersonation",
    illegal: "illegal content",
  },
  regleParDefaut: "one of the community rules",
  jusquAu: (date: string) => `until ${date}`,
  jusquANouvelOrdre: "until further notice",
  motEquipe: (message: string) => `A word from the team: “${message}”`,
  boutonMonCompte: "Open My account",
  limite: {
    objetAVenir: "Your SOS Miam account is about to be restricted",
    objet: "Your SOS Miam account is restricted",
    titre: (prenom: string) => `${prenom}, your account is restricted`,
    aVenir: (debut: string, fin: string) => `The SOS Miam team is going to restrict your account from ${debut}, ${fin}.`,
    deja: (fin: string) => `The SOS Miam team has restricted your account ${fin}.`,
    regle: (regle: string) => `The rule in question: ${regle}.`,
    explication: (motivation: string) => `What the team says: “${motivation}”`,
    contester: "Don't agree? Tell us why from “My account” (once, while the restriction lasts): someone else on the team will read everything again and get back to you.",
  },
  levee: {
    objet: "Your SOS Miam account is no longer restricted",
    titre: (prenom: string) => `It's lifted, ${prenom}`,
    apresReexamen: "We've read your appeal again, and you were right: the restriction on your account has been lifted.",
    parEquipe: "The SOS Miam team has lifted the restriction on your account.",
    fin: "Everything's back to normal. Thanks for your patience – see you soon in all the good spots!",
  },
  maintenue: {
    objet: "We've read your appeal",
    titre: (prenom: string) => `We've read your appeal, ${prenom}`,
    relue: (fin: string) => `Someone else on the team has read everything again: the restriction on your account stays in place, ${fin}.`,
    regle: (regle: string) => `The rule in question is still: ${regle}.`,
    possible: "You can still read, get visits confirmed, export your data or delete your account from “My account”.",
  },
};
