import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { aideAjouterMotDePasse, AVERTISSEMENT_RELAIS_APPLE, CHAPO_MES_CONNEXIONS, messagesMesConnexions } from "~/contenus/mes-connexions";

export const CHAPO_MES_CONNEXIONS_ANGLAIS: Traduction<typeof CHAPO_MES_CONNEXIONS> =
  "One account, several keys – keep the ones that suit you. Your SOS Miam email address stays the same whatever happens.";

export const messagesMesConnexionsAnglais: Traduction<typeof messagesMesConnexions> = {
  relie: (nom: string) =>
    `Linked! You can now log in with ${nom}, as well as with your other keys. Your SOS Miam email address stays exactly as it is.`,
  delie: (nom: string) => `Unlinked: ${nom} no longer opens the door to SOS Miam. Your other keys still work.`,
  autreCompte: (nom: string) => `That's not the ${nom} account linked to your SOS Miam account. Try again with the right one.`,
  lienEnvoye: "On its way! A link is waiting in your inbox (have a look in your spam folder too). It's valid for 24 hours.",
  confirmationImpossibleIci: (nom: string, autre: string, geste: "relier" | "délier" = "délier") =>
    `Without a password, it's ${autre} that confirms… and ${autre} won't open here${autre === "Apple" ? " (it needs an iPhone)" : ""}. The easiest way: add a password first (we'll send you the link), then come back to ${geste === "relier" ? "link" : "unlink"} ${nom}. Or do it from ${autre === "Apple" ? "your iPhone" : "your phone"} 😉`,
  suppressionImpossibleIci:
    "There's no way to confirm it's really you here: Apple only opens on an iPhone (and Google doesn't open in the web preview). Add a password first (we'll send you the link), or come back and delete your account from your iPhone.",
  lectureRatee: "Your keys couldn't load (the network, most likely)",
};

export const aideAjouterMotDePasseAnglais: Traduction<typeof aideAjouterMotDePasse> = (email: string) => `We'll send a link to ${email} so you can choose it (valid for 24 hours).`;

export const AVERTISSEMENT_RELAIS_APPLE_ANGLAIS: Traduction<typeof AVERTISSEMENT_RELAIS_APPLE> =
  "This is a Hide My Email address from Apple: the link will only arrive if email forwarding is turned on for SOS Miam in your Apple Account settings (“Sign in with Apple”).";
