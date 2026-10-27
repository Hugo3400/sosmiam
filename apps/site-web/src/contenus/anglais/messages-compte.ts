import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MESSAGES_COMPTE } from "../messages-compte.ts";

export const TEXTES_MESSAGES_COMPTE_ANGLAIS: Traduction<typeof TEXTES_MESSAGES_COMPTE> = {
  occupe: "It's very busy right now – try again in a moment.",
  panne: "Oops, that didn't work. Try again in a moment, or email us at bonjour@sosmiam.fr.",
  tropDEssais: (attente: string) => `Too many tries – try again in ${attente}.`,
  attente: {
    quelquesMinutes: "a few minutes",
    minutes: (nombre: number) => `${nombre} ${accorder(nombre, "en", "minute", "minutes")}`,
    heures: (nombre: number) => `${nombre} ${accorder(nombre, "en", "hour", "hours")}`,
    heuresEtMinutes: (heures: string, minutes: string) => `${heures} and ${minutes}`,
  },
  prenom: "Enter your first name or a nickname (40 characters max).",
  prenomRefuse: "That first name doesn't go down well here. Choose another first name or nickname.",
  email: "That email address doesn't look right.",
  motDePasse: "Your password needs at least 12 characters (and no more than 128).",
  motDePasseRefuse:
    "That password is too easy to guess (too common, a sequence, a repeat, your email…), or it's only numbers (then you need 16). Choose another one – a short sentence works really well.",
  dateNaissance: "Enter your date of birth (day, month and year).",
  ville: "Enter your city (2 to 80 characters).",
  quartier: "The neighbourhood can be 80 characters max.",
  cgu: "To create your account, tick the box to accept the Terms of Use.",
  motDePasseConfirmer: "Enter your password to confirm.",
  motDePasseIncorrect: "That's not your password.",
  jeton: "Paste the code from the email: the letters and numbers after “jeton=”.",
};
