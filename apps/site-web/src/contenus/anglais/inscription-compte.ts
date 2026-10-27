import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_INSCRIPTION_COMPTE } from "~/contenus/inscription-compte";

export const TEXTES_INSCRIPTION_COMPTE_ANGLAIS: Traduction<typeof TEXTES_INSCRIPTION_COMPTE> = {
  espaces: {
    ambassadeur: {
      titre: "Become an ambassador",
      description: "Create your SOS Miam ambassador account (18+). The team approves every sign-up.",
      chapo: "It's free, for over-18s. The team reads every sign-up: once yours is approved, your area opens up.",
      aidePrenom: "It may show as “Spotted by …” on the page of a place you suggested.",
      apres: "The team reads every sign-up before opening your area. This account will also be your SOS Miam app account when the app comes out. What we do with your data: ",
    },
    pro: {
      titre: "Create your Pro account",
      description: "Create your SOS Miam account to manage your venue's listing (18+). It's free, with no subscription and no commission.",
      chapo: "It's free, for over-18s, with no subscription and no commission. Then you find your venue and the team checks it's really yours.",
      aidePrenom: "Your team will see it when you invite them.",
      apres: "One SOS Miam account: the same one for the app when it comes out. What we do with your data: ",
    },
  },
  separateur: "or create your account with your email",
  emailPris: "There's already an account with this address. Log in, or use “Forgotten your password?”",
  champInvalide: "Something's not right – check the form.",
  tropDInscriptions: "Easy does it! Too many sign-ups in a row from your connection – try again in an hour.",
  pasPassee: "Oops, your sign-up didn't go through. Try again in a moment, or email us at bonjour@sosmiam.fr.",
  newsletter: "Yes, send me the SOS Miam newsletter: new places, new cities and places with a BIG SOS near me. Unsubscribe in one click, no hard feelings 🍟",
  creerMonCompte: "Create my account",
  dejaUnCompte: "Already have an account? ",
  connecteToi: "Log in",
  aideDateNaissance: "It's only used to check your age. We don't keep it.",
  refusAge: {
    titre: "Just a little longer!",
    rienGarde: "SOS Miam is for over-18s: the app, the Ambassador programme and the Pro area. We haven't kept anything – not your email, not your date of birth.",
    enAttendant: "In the meantime, you can follow the SOS Miam adventure with the newsletter. And when you turn 18, we'll be waiting for you!",
    bouton: "Get the newsletter",
  },
};
