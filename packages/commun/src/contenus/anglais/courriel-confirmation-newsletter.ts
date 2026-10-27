import type { Traduction } from "../../types/traduction.ts";
import type { TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER } from "../courriel-confirmation-newsletter.ts";

export const TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_ANGLAIS: Traduction<typeof TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER> = {
  objet: "One little click to confirm your newsletter 🛟",
  titre: "One more little click and you're one of us!",
  paragraphes: (echeance: string) => [
    "Someone (you, we hope!) has just asked for the SOS Miam newsletter with this address: new places, new cities and the BIG SOS near you.",
    "Before we write to you, we'd rather check it's really you. One click on the button and you've joined the Miamis.",
    `The link works until ${echeance}, just once. Already signed up? It simply updates your details.`,
    "Didn't ask for this? Just ignore this email: without a click, the request disappears on its own after 7 days, and Capitaine Bouiboui goes back to napping.",
  ],
  bouton: "Confirm my sign-up",
  pieds: {
    app: "You're getting this email because the newsletter box was ticked when an SOS Miam account was created with this address. Without your click, you won't get any newsletter.",
    site: "You're getting this email because this address was typed into the “Keep me posted” form on sosmiam.fr. Without your click, you won't get any newsletter.",
  },
};
