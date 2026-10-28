import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ENCART_PHOTO_LOCALE, TEXTES_MENTION_PHOTO_PROFIL } from "~/contenus/textes-profil-photo";

export const TEXTES_ENCART_PHOTO_LOCALE_ANGLAIS: Traduction<typeof TEXTES_ENCART_PHOTO_LOCALE> = {
  titre: "📸 Your photo has stayed on this phone",
  texte: "Your photo is only visible on this phone. Show it to your crew and the Miamis? It'll appear wherever your avatar does, and you can remove it whenever you like.",
  preparation: "Getting your photo ready",
  montrer: "Show it",
  indiceMontrer: "Your photo goes up on SOS Miam, where others can see it",
  laisser: "Leave it as it is",
  indiceLaisser: "Your photo stays on this phone",
};

export const TEXTES_MENTION_PHOTO_PROFIL_ANGLAIS: Traduction<typeof TEXTES_MENTION_PHOTO_PROFIL> = {
  sansCompte: "🔒 Without an account, your photo stays on your phone.",
  photoLocale: "🔒 Your current photo is only visible on this phone.",
  visibilite:
    "📸 A photo is visible to other Miamis wherever your avatar appears (your crew, your comments, messages), even if your account is private. Change it or remove it whenever you like. A photo of you or your favourite dish – not someone else's, and nothing explicit.",
  regles: "Profile photo rules",
  lienRegles: "https://sosmiam.fr/en/cgu#photo-profil",
};
