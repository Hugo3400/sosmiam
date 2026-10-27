import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_VERIFICATION_EMAIL } from "~/contenus/verification-email";

export const TEXTES_VERIFICATION_EMAIL_ANGLAIS: Traduction<typeof TEXTES_VERIFICATION_EMAIL> = {
  titre: "Confirm my email",
  description: "Confirm your SOS Miam account's email address.",
  chapo: "One click to tell us this address is really yours.",
  confirme: "Confirmed!",
  dejaConfirmee: "Your address is already confirmed",
  merci: "Thanks! The team can now see that this address is really yours.",
  allerEspace: "Go to my area",
  meConnecter: "Log in",
  jetonInvalide: "This link doesn't work any more: it's already been used, or it's more than 7 days old.",
  onVerifie: "Checking your link…",
  bouton: "Confirm my address",
  lienRefuse: "Link not working any more? We'll send you a new one, to your account's address.",
  pasRecu: "No link arrived? We'll send you a new one, to your account's address.",
  renvoyerUnLien: "Send a new link",
  connecteToi: "Link not working any more? Log in: from your area, you can get a new one sent to you.",
  bandeau: {
    justeInscrit: "We've sent you a link to confirm your email (it works for 7 days). Remember to check your spam!",
    aConfirmer: "Confirm your email address: we've sent you a link.",
    bouton: "Resend the link",
  },
  renvoi: {
    dejaVerifie: "Good news: your address is already confirmed!",
    envoye: "Here we go: a new link is waiting in your inbox (it works for 7 days). Remember to check your spam!",
    tropTot: (attente: string) => `A link went out a short while ago. Wait ${attente} before asking for another one (and check your spam).`,
    pasParti: "Oops, the link didn't go out. Try again in a moment, or email us at bonjour@sosmiam.fr.",
  },
};
