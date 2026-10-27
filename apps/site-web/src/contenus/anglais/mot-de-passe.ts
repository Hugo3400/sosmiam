import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MOT_DE_PASSE } from "~/contenus/mot-de-passe";

export const TEXTES_MOT_DE_PASSE_ANGLAIS: Traduction<typeof TEXTES_MOT_DE_PASSE> = {
  oublie: {
    titreMeta: "Forgotten password",
    description: "Forgotten your SOS Miam password? Get a link to choose a new one.",
    titre: "Forgotten your password?",
    chapo: "Don't panic, it happens to everyone. Give us your email and we'll send you a link to choose a new one.",
    cestNote: "Got it!",
    reponseEnvoi:
      "If there's an account with this address, you'll get a link to choose a new password. It works for 24 hours, just once. Remember to check your spam!",
    retourConnexion: "Back to log in",
    bouton: "Send me the link",
    aideEmail: "Your account's address.",
    rienRecu: "Nothing arrived, even in your spam? Email us from your account's address at ",
    tropDeDemandes: (attente: string) => `Easy does it! Too many requests in a row from your connection – try again in ${attente}.`,
    pasPassee: (email: string) => `Oops, your request didn't go through. Try again in a moment, or email us at ${email}.`,
  },
  nouveau: {
    titre: "New password",
    description: "Choose a new password for your SOS Miam account.",
    chapo: "Choose a new one: it replaces the old one straight away.",
    cestFait: "Done!",
    connecteToi: "Log in with your new password.",
    meConnecter: "Log in",
    jetonInvalide: "This link doesn't work any more: it's already been used, or it's more than 24 hours old. Ask for a new one on the Forgotten password page.",
    tropDEssais: "Too many tries – try again in 10 minutes.",
    bouton: "Save my password",
    lienReconnu: "Your link has been recognised.",
  },
  changer: {
    bouton: "Change my password",
  },
};
