import type { Traduction } from "../../types/traduction.ts";
import type { TEXTES_COURRIELS_COMPTES } from "../courriels-comptes.ts";

export const TEXTES_COURRIELS_COMPTES_ANGLAIS: Traduction<typeof TEXTES_COURRIELS_COMPTES> = {
  ambassadeurValide: {
    objet: (prenom: string) => `You're in, ${prenom}: welcome to the ambassadors 🛟`,
    titre: (prenom: string) => `Welcome to the crew, ${prenom}!`,
    paragraphes: [
      "We've read your sign-up and it's all good: your ambassador area is open.",
      "You can share your hidden gems there, keep an eye on your points and badges, and find the team's missions and messages. The places we help count on people like you to get noticed – thanks for being here.",
      "Got a question? Just reply to this email – we read everything.",
    ],
    bouton: "Open my area",
    pied: "You're getting this email because you signed up for the SOS Miam ambassador area.",
  },
  certifie: {
    objet: (prenom: string) => `You're now a Certified Ambassador ✓, ${prenom}!`,
    titre: (prenom: string) => `Well done ${prenom}, you're certified ✓`,
    paragraphes: [
      "We've read your application and it's a yes: you're now one of our certified ambassadors, the ones who give places a real helping hand.",
      "Your “Certified Ambassador ✓” badge will show on the pages of the places you help. The team may give you missions with partner places, and your pro media kit is waiting in your area.",
      "The golden rule doesn't change: a place never pays you. If a place gives you something, say so clearly with the French label “Collaboration commerciale” (a paid or gifted partnership).",
      "Got a question? Just reply to this email – we read everything.",
    ],
    bouton: "Open my area",
    pied: "You're getting this email because your application to become a certified ambassador was accepted.",
  },
  alerteRetrait: {
    objet: (date: string) => `Your SOS Miam ambassador role ends on ${date}`,
    titre: (prenom: string) => `We miss you, ${prenom}!`,
    paragraphes: (date: string) => [
      `Your ambassador area hasn't been used for almost a year. As our rules say, your ambassador role will end on ${date}, and your missions and messages will go with it. Your SOS Miam account, points and badges will stay.`,
      `Want to keep going? Just log in before ${date}. Otherwise, there's nothing to do.`,
    ],
    bouton: "Log in",
    pied: "You're getting this email because you're an SOS Miam ambassador. It's the only one we'll send you about this.",
  },
  alerteEffacement: {
    objet: (date: string) => `Your SOS Miam account will be deleted on ${date}`,
    titre: (prenom: string) => `We haven't seen you in a while, ${prenom}`,
    paragraphes: (date: string) => [
      `Your SOS Miam account hasn't been used for almost two years. As promised in our privacy policy, it will be deleted for good on ${date}, along with everything that goes with it.`,
      `Want to keep it? Just log in before ${date}. Otherwise, there's nothing to do: we'll delete everything, with no further reminder.`,
    ],
    bouton: "Log in",
    pied: "You're getting this email because you have an SOS Miam account. It's the only one we'll send you about this.",
  },
  motDePasse: {
    objet: "Your link to choose a new password",
    titre: (prenom: string) => `A new password, ${prenom}?`,
    paragraphes: (echeance: string) => [
      `Here's your link to choose a new password. It works until ${echeance}, just once.`,
      "Didn't ask for this? Just ignore this email: your current password stays the same.",
    ],
    bouton: "Choose my password",
    pied: "You're getting this email because a password reset was set up for your SOS Miam account.",
  },
  verificationEmail: {
    objet: "Confirm your SOS Miam email address 🛟",
    titre: (prenom: string) => `Welcome, ${prenom}!`,
    paragraphes: (echeance: string) => [
      "One more click: confirm this address is really yours, and your sign-up goes to the team, who'll look at it by hand.",
      `The link works until ${echeance}, just once.`,
      "Didn't ask for this? Just ignore this email: without confirmation, nothing happens.",
    ],
    bouton: "Confirm my address",
    pied: "You're getting this email because someone (you, we hope!) has just created an SOS Miam account with this address.",
  },
  ecrit: {
    pied: "This email was written to you by the SOS Miam team. To get back to us, just reply to this email.",
  },
  bouton: (texte: string, adresse: string) => `${texte}: ${adresse}`,
};
