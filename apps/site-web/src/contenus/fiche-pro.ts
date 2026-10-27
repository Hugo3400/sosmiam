import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_FICHE_PRO_ANGLAIS } from "~/contenus/anglais/fiche-pro";
import { NOMS_CHAMPS } from "~/contenus/infos-pratiques";

export const EXEMPLES_FICHE_PRO = {
  adresse: "12 rue de la Paix",
  telephone: "04 67 12 34 56",
  siteWeb: "https://…",
};

export const TEXTES_FICHE_PRO = {
  meta: {
    titre: (nom: string) => `Ma fiche · ${nom}`,
    titreParDefaut: "Ma fiche",
    description: "La fiche de ton lieu sur SOS Miam.",
  },
  page: "Ma fiche",
  chapo: "Horaires, présentation, contact et infos pratiques : en ligne dès que tu enregistres.",
  messages: {
    reserveAuGerant: "Seul le gérant modifie la fiche.",
    rienChange: "Rien n'a changé : ta fiche est déjà comme ça !",
    enLigne: (champs: string) => `C'est en ligne : ${champs}.`,
    versEquipe: {
      deux: "Le nom et l'adresse partent vers l'équipe SOS Miam : sa décision s'affichera dans Suggestions.",
      nom: "Le nom part vers l'équipe SOS Miam : sa décision s'affichera dans Suggestions.",
      adresse: "L'adresse part vers l'équipe SOS Miam : sa décision s'affichera dans Suggestions.",
    },
    champInvalide: "Ce champ ne passe pas : vérifie-le (longueur, forme, mots).",
    messageInvalide: "Ce petit mot ne passe pas : raccourcis-le un peu.",
    tropDeSuggestions: "Il y a déjà des changements de nom ou d'adresse en attente : rien n'a été enregistré. Retire le nom et l'adresse pour enregistrer le reste, ou attends la réponse de l'équipe.",
    panne: "Oups, ta fiche n'a pas été enregistrée. Réessaie dans un instant.",
  },
  erreurs: {
    nom: "Le nom fait entre 2 et 80 caractères.",
    adresse: "L'adresse fait 160 caractères au plus.",
    horaires: "Les horaires font 160 caractères au plus : résume, les gourmands comprendront.",
    texte: "La présentation fait 1 000 caractères au plus.",
    message: "Ce petit mot fait 1 000 caractères au plus.",
    telephone: "Ce numéro ne semble pas valide (chiffres et espaces : 04 67 12 34 56).",
    siteWeb: "Écris l'adresse complète du site, avec https:// (200 caractères au plus).",
    instagram: "Juste le nom du compte, sans « @ » : chezjo.montpellier.",
  },
  formulaire: {
    bouton: "Enregistrer ma fiche",
    envoi: "Enregistrement…",
    sansAvis: "Je ne précise pas",
    oui: "Oui",
    non: "Non",
    nomAdresse: {
      titre: "Nom et adresse",
      note: "Ces deux-là passent par l'équipe SOS Miam : elle vérifie, puis la fiche change. C'est pour éviter les mauvaises blagues.",
      nom: "Nom du lieu",
      adresse: "Adresse",
      message: "Un mot pour l'équipe",
      aideMessage: "Seulement si tu changes le nom ou l'adresse : pourquoi ? (« On a déménagé en septembre », par exemple.)",
    },
    horaires: {
      titre: "Horaires et présentation",
      note: "En ligne tout de suite.",
      horaires: "Horaires",
      exempleHoraires: "Mar–sam, 12h–14h30 et 19h–23h",
      texte: "Présentation",
      aideTexte: "Ce qui rend ton lieu unique : la spécialité, l'ambiance, l'histoire. Parle comme à un client au comptoir.",
    },
    contact: {
      titre: "Contact",
      note: "En ligne tout de suite. Laisse vide ce que tu ne veux pas montrer.",
      telephone: "Téléphone",
      siteWeb: "Site",
      instagram: "Compte Instagram",
      aideInstagram: "Juste le nom du compte, sans « @ ».",
    },
    infos: {
      titre: "Infos pratiques",
      note: "En ligne tout de suite. « Je ne précise pas » : rien n'est affiché, on ne devine jamais à ta place.",
      animaux: "Les animaux",
      reservation: "La réservation",
      paiements: "Les paiements acceptés",
      aidePaiements: "Coche tout ce que tu acceptes. Rien de coché : rien n'est affiché.",
    },
  },
  lecture: {
    note: "Tu fais partie de l'équipe : tu vois la fiche, et seul le gérant la modifie. Une erreur ? Dis-le-lui !",
    titre: "Horaires et présentation",
    adresse: "Adresse",
    horaires: "Horaires",
    presentation: "Présentation",
    adresseVide: "Pas encore indiquée",
    horairesVides: "Pas encore indiqués",
    presentationVide: "Pas encore écrite",
  },
  valeurs: {
    rien: "(rien)",
    oui: "Oui",
    non: "Non",
  },
  nomsChamps: NOMS_CHAMPS,
};

export const TEXTES_FICHE_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_FICHE_PRO>> = {
  fr: TEXTES_FICHE_PRO,
  en: TEXTES_FICHE_PRO_ANGLAIS,
};
