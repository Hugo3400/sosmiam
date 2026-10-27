import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_INVITATION } from "~/contenus/invitation";

export const TEXTES_INVITATION_ANGLAIS: Traduction<typeof TEXTES_INVITATION> = {
  meta: {
    titre: (pseudo: string) => `Join @${pseudo}'s crew — SOS Miam`,
    introuvable: "Invitation not found — SOS Miam",
    description: "Open SOS Miam to join their crew and rescue tables together.",
  },
  titre: (pseudo: string) => `Open SOS Miam to join @${pseudo}'s crew`,
  chapo: "A crew is a bunch of friends rescuing tables together. All that's missing is you on board.",
  ouvrirApp: "Open the app",
  pasEncore: "Don't have the app yet? It's in the works and coming soon to the stores. Keep this link somewhere safe – it'll work as soon as the app's out.",
  bientot: (store: string) => `${store}: coming soon`,
  introuvable: {
    titre: "Invitation not found",
    chapo: "This invitation link seems to have sprung a leak on the way. Ask your friend to send it again, or to show you their QR code in the app.",
  },
  decouvrir: "Discover SOS Miam",
};
