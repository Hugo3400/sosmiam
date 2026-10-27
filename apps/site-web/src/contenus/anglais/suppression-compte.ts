import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_SUPPRESSION_COMPTE } from "~/contenus/suppression-compte";

export const TEXTES_SUPPRESSION_COMPTE_ANGLAIS: Traduction<typeof TEXTES_SUPPRESSION_COMPTE> = {
  attention: "Careful: this is permanent.",
  avertissements: {
    ambassadeur: (email: string) =>
      `Your account is deleted straight away, along with your points, badges, application, missions and messages. The places you suggested stay with us, but they're no longer linked to your account. If one of them shows “Spotted by” with your first name, your first name stays there: email us at ${email} and we'll remove it. A copy may remain in our encrypted backups for up to 30 days, then it's gone.`,
    pro: () =>
      "Your account is deleted straight away, along with your links to venues (including your place on their team), your pending requests, your points and your badges. Anything you added to a venue's listing stays there, without your name. If you were the only person running a venue, it loses its “Verified ✓” until someone else takes it over. A copy may remain in our encrypted backups for up to 30 days, then it's gone.",
    compte: () =>
      "Your account is deleted straight away, along with everything linked to it: your profile, points, badges and logins, in the app and on the site. A copy may remain in our encrypted backups for up to 30 days, then it's gone.",
  },
  bouton: "Delete my account",
  boutonDefinitif: "Delete my account for good",
  enCours: "Deleting…",
  confirme: (fournisseur: string) => `${fournisseur} has confirmed it's you. Last step: the button below.`,
  reconnecteToi: "Your account doesn't have a password. To delete your account, confirm it's you by logging in again with the linked account.",
  sansCompteLie: (email: string) => `Your account doesn't have a password. Choose one with “Forgotten your password?”, or email us at ${email} and we'll delete it.`,
};
