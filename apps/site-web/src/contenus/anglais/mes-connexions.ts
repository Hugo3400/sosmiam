import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MES_CONNEXIONS } from "../mes-connexions.ts";

export const TEXTES_MES_CONNEXIONS_ANGLAIS: Traduction<typeof TEXTES_MES_CONNEXIONS> = {
  messages: {
    relie: "Linked! You can now log in with {fournisseur}, as well as your other ways. Your SOS Miam email address stays the same.",
    delie: "Unlinked: {fournisseur} no longer opens the door to SOS Miam for you. Your other ways to log in still work.",
    "identite-deja-reliee":
      "This {fournisseur} account is already linked to another SOS Miam account. We never merge two accounts: log in to the other account, unlink {fournisseur} from its “My account” page (or delete that account if you no longer need it), then come back and link it here.",
    "deja-relie": "Your SOS Miam account already has a different {fournisseur} account linked. Unlink it first, then link the new one.",
    "derniere-connexion": "It's your only way to log in – without it, you'd be locked out! Add a password or link another account first.",
    "autre-compte": "That's not the {fournisseur} account linked to your SOS Miam account – start again with the right one.",
    refuse: "{fournisseur} couldn't confirm who you are. Try again in a moment.",
    expire: "That took a little too long (10 minutes max). Start again – it's quick!",
    annule: "No worries, nothing's changed.",
    "trop-de-demandes": "Easy does it! Too many tries in a row – try again in a little while.",
    indisponible: "Oops, {fournisseur} isn't responding right now. Try again in a moment.",
  },
  appleOuGoogle: "Apple or Google",
  titre: "My ways to log in",
  chapo: "One account, several keys: keep the ones that suit you. Your SOS Miam email address stays the same whatever happens.",
  illisible: "We can't load your ways to log in right now. Reload the page in a little while!",
  aideAjouterMotDePasse: "We'll send a link to {email} so you can choose your password (valid for 24 hours).",
  avertissementRelaisApple:
    "Your address is a Hide My Email address from Apple: the link will only arrive if email forwarding is turned on for SOS Miam in your Apple Account settings (“Sign in with Apple”).",
  lienMotDePasseEnvoye: "Done! A link is waiting in your inbox (have a look in your spam too). It's valid for 24 hours.",
  emailEtMotDePasse: "Email and password",
  active: "On",
  pasDeMotDePasse: "No password yet",
  ajouterMotDePasse: "Add a password",
  envoiDuLien: "Sending the link…",
  relie: "Linked",
  pasRelie: "Not linked",
  relier: "Link",
  delier: "Unlink",
  monCompte: (fournisseur: string) => ` my ${fournisseur} account`,
  pourRelier: (fournisseur: string) => `To link ${fournisseur} here, add a password first – that's how we'll confirm it's you.`,
  seuleFacon: (autre: string, fournisseur: string) => `It's your only way to log in. Add a password or link ${autre} before you can unlink ${fournisseur}.`,
  pourDelier: (fournisseur: string) => `To unlink ${fournisseur}, add a password first.`,
  delierFournisseur: (fournisseur: string) => `Unlink ${fournisseur}`,
  enCoursDelier: "Unlinking…",
  enCoursRelier: "Linking…",
  plusAvec: (fournisseur: string) => `You won't be able to log in with ${fournisseur} any more. Your email and password will still work.`,
  reconnecteAvec: (autre: string) => `Your account doesn't have a password. To confirm, log in again with ${autre}. That will be your way to log in from now on.`,
  confirmation: {
    titreRelier: (fournisseur: string) => `Link your ${fournisseur} account?`,
    titreDelier: (fournisseur: string) => `Unlink your ${fournisseur} account?`,
    delier: (fournisseur: string, cible: string) =>
      `${fournisseur} has confirmed it's you. You won't be able to log in with ${cible} any more. ${fournisseur} will be your way to log in.`,
    relierAvecMotDePasse: (fournisseur: string) =>
      `${fournisseur} said yes. One last check before adding this key: your password. After that, you'll be able to log in to SOS Miam with ${fournisseur}, as well as your other ways. Your SOS Miam email address won't change.`,
    relierConfirme: (fournisseur: string, autre: string) =>
      `${fournisseur} and ${autre} have confirmed it's you. You'll be able to log in to SOS Miam with ${fournisseur} as well as ${autre}. Your SOS Miam email address won't change.`,
    attendAutre: (fournisseur: string, autre: string) =>
      `${fournisseur} said yes. Your account doesn't have a password, so to check it's you, log in again with ${autre}, your current key. Then it's just one button and you're linked!`,
    autreIndisponible: (fournisseur: string, autre: string) =>
      `${fournisseur} said yes, but your account doesn't have a password, and ${autre} can't be used here to confirm. Add a password first (just below), then come back to link ${fournisseur}.`,
    ouiRelier: (fournisseur: string) => `Yes, link ${fournisseur}`,
    ouiDelier: (fournisseur: string) => `Yes, unlink ${fournisseur}`,
    nonMerci: "No thanks",
  },
};
