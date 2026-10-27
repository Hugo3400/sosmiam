import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_FORMULAIRE_COMPTE_ANGLAIS } from "~/contenus/anglais/formulaire-compte";

export const TEXTES_FORMULAIRE_COMPTE = {
  envoi: "Envoi…",
  unChamp: "Un champ est à corriger.",
  plusieursChamps: (nombre: number) => `${nombre} champs sont à corriger.`,
  facultatif: " (facultatif)",
  afficher: "Afficher",
  masquer: "Masquer",
  afficherMotDePasse: "Afficher le mot de passe",
  masquerMotDePasse: "Masquer le mot de passe",
  compteur: (longueur: number, maximum: number) => `${longueur} / ${maximum} caractères`,
  communeChoisie: (commune: string) => `Commune choisie : ${commune}`,
  taCommune: "Ta commune",
  seDeconnecter: "Se déconnecter",
  champs: {
    prenom: "Ton prénom (ou un surnom)",
    email: "Ton e-mail",
    exempleEmail: "ton@email.fr",
    motDePasse: "Ton mot de passe",
    motDePasseActuel: "Ton mot de passe actuel",
    nouveauMotDePasse: "Ton nouveau mot de passe",
    motDePasseConfirmer: "Ton mot de passe, pour confirmer",
    aideMotDePasse: "12 caractères au moins (16 si ce ne sont que des chiffres). Astuce : une petite phrase marche très bien.",
    dateNaissance: "Ta date de naissance",
    ville: "Ta ville",
    quartier: "Ton quartier",
    codeRecu: "Code reçu par mail",
    aideCode: "C'est la suite de lettres et de chiffres après « jeton= » dans le lien qu'on t'a envoyé. Tu peux aussi coller le lien en entier.",
  },
  conditions: {
    jAccepte: "J'accepte les ",
    lien: "conditions d'utilisation",
    nouvelOnglet: " (s'ouvre dans un nouvel onglet)",
    tesDonnees: "Ce qu'on fait de tes données : ",
    confidentialite: "confidentialité",
  },
};

export const TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_FORMULAIRE_COMPTE>> = {
  fr: TEXTES_FORMULAIRE_COMPTE,
  en: TEXTES_FORMULAIRE_COMPTE_ANGLAIS,
};
