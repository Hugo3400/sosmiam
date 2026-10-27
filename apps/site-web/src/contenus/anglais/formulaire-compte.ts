import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_FORMULAIRE_COMPTE } from "~/contenus/formulaire-compte";

export const TEXTES_FORMULAIRE_COMPTE_ANGLAIS: Traduction<typeof TEXTES_FORMULAIRE_COMPTE> = {
  envoi: "Sending…",
  unChamp: "One field needs fixing.",
  plusieursChamps: (nombre: number) => `${nombre} fields need fixing.`,
  facultatif: " (optional)",
  afficher: "Show",
  masquer: "Hide",
  afficherMotDePasse: "Show password",
  masquerMotDePasse: "Hide password",
  compteur: (longueur: number, maximum: number) => `${longueur.toLocaleString("en-GB")} / ${maximum.toLocaleString("en-GB")} characters`,
  communeChoisie: (commune: string) => `Town chosen: ${commune}`,
  taCommune: "Your town",
  seDeconnecter: "Log out",
  champs: {
    prenom: "Your first name (or a nickname)",
    email: "Your email",
    exempleEmail: "you@example.com",
    motDePasse: "Your password",
    motDePasseActuel: "Your current password",
    nouveauMotDePasse: "Your new password",
    motDePasseConfirmer: "Your password, to confirm",
    aideMotDePasse: "At least 12 characters (16 if it's only numbers). Tip: a short sentence works really well.",
    dateNaissance: "Your date of birth",
    ville: "Your city",
    quartier: "Your neighbourhood",
    codeRecu: "Code from the email",
    aideCode: "It's the letters and numbers after “jeton=” in the link we sent you. You can also paste the whole link.",
  },
  conditions: {
    jAccepte: "I accept the ",
    lien: "Terms of Use",
    nouvelOnglet: ", opens in a new tab",
    tesDonnees: "What we do with your data: ",
    confidentialite: "privacy",
  },
};
