import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_CONNEXIONS } from "~/contenus/textes-reglages-connexions";

export const TEXTES_REGLAGES_CONNEXIONS_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_CONNEXIONS> = {
  titre: "Your keys to get in",
  toucherPourReessayer: "Tap to try again",
  ajoutSansEmail: "We'll send you a link so you can choose it (valid for 24 hours).",
  relie: (nom: string) => `${nom}: linked ✅`,
  unInstant: "Just a sec…",
  delierDetail: (nom: string) => `Tap to unlink ${nom}`,
  relierMonCompte: (nom: string) => `Link my ${nom} account`,
  changerMotDePasse: "Change my password",
  changerMotDePasseDetail: "Your other devices will be logged out",
  lienEnvoye: "Link sent!",
  ajouterMotDePasse: "Add a password",
  gesteApple: "Get in with a quick Face ID, as well as your other keys",
  gesteGoogle: "Get in with one tap using your Google account",
  tonMotDePasse: "Your password",
  confirmerAvec: (autre: string) => `Continue with ${autre}`,
  finalementNon: "Actually, no",
  relier: {
    titre: (nom: string) => `Link ${nom}`,
    sousTitre: (nom: string) => `One more key on your keyring – you'll be able to get in with ${nom}. Your SOS Miam email address stays exactly as it is.`,
    avecMotDePasse: (nom: string) => `Before adding a key, we check it's really you: your password first, then ${nom} opens.`,
    sansMotDePasse: (nom: string, autre: string) => `You don't have a password, so confirm with ${autre} first – it's your current key. Straight after, ${nom} opens so you can link it.`,
  },
  delier: {
    titre: (nom: string) => `Unlink ${nom}`,
    sousTitre: (nom: string) => `${nom} won't open the door to SOS Miam any more. Your other keys still work.`,
    avecMotDePasse: "To confirm it's really you, enter your password:",
    sansMotDePasse: (autre: string) => `You don't have a password, so confirm with ${autre} – it's the key you'll have left.`,
  },
};
