// Libellés du programme Ambassadeurs (règles : packages/commun/src/regles/ambassadeurs.ts, docs/decisions.md).
import type { Mission, Palier, StatutAmbassadeur } from "~/services/ambassadeurs.ts";

export const PALIERS: Record<Palier, { nom: string; emoji: string }> = {
  curieux: { nom: "Curieux", emoji: "👀" },
  denicheur: { nom: "Dénicheur", emoji: "🔎" },
  "ambassadeur-quartier": { nom: "Ambassadeur de quartier", emoji: "🏘️" },
  "ambassadeur-ville": { nom: "Ambassadeur de ville", emoji: "🎖️" },
};

export const STATUTS_AMBASSADEUR: Record<StatutAmbassadeur, { libelle: string; ton: "jaune" | "vert" | "rouge" | "neutre" }> = {
  "en-attente": { libelle: "À valider", ton: "jaune" },
  actif: { libelle: "Actif", ton: "vert" },
  suspendu: { libelle: "Suspendu", ton: "rouge" },
  refuse: { libelle: "Refusé", ton: "neutre" },
};

export const BADGES: Record<string, string> = {
  "premier-sauveteur": "🚀 Premier sauveteur",
  "deniche-par-toi": "🔎 Déniché par toi",
  fondateur: "🏅 Fondateur",
};

export const RAISONS_POINTS: Record<string, string> = {
  visite: "Visite validée",
  "visite-sos": "Visite d'un lieu en SOS",
  "avis-photo": "Avis avec photo",
  "proposer-lieu": "Lieu proposé et accepté",
  "corriger-fiche": "Fiche corrigée",
  "premier-sauveteur": "Premier sauveteur",
  rescousse: "Rescousse",
  defi: "Défi",
  equipe: "Par l'équipe",
};

export const ENVIES_FONDATEUR: Record<string, string> = {
  denicher: "Dénicher des lieux",
  fiches: "Faire les fiches avec les lieux",
  selections: "Préparer des sélections",
  "faire-savoir": "Faire connaître SOS Miam",
};

export const ETATS_MISSION: Record<Mission["statut"], { libelle: string; ton: "jaune" | "vert" | "neutre" }> = {
  "a-faire": { libelle: "À faire", ton: "jaune" },
  faite: { libelle: "Faite", ton: "vert" },
  annulee: { libelle: "Annulée", ton: "neutre" },
};

/**
 * Fondateurs par ville (décidé le 9 octobre 2026, docs/decisions.md) : en attendant la nouvelle version, aucune
 * candidature n'est acceptée ni refusée ; chacune est rangée dans la ville (ou le département) de la personne. Passe à
 * false au signal de la session Site (candidature par commune et carte « n° 3 de Lyon · n° 147 en France » en ligne).
 */
export const FONDATEURS_EN_PREPARATION = false;

/** « Ambassadeur certifié » : qui candidate (decisions.md, « Ambassadeur certifié ») */
export const PROFILS_CERTIFIE: Record<string, string> = {
  ambassadeur: "Ambassadeur qui aime aider les lieux",
  pro: "Pro (restaurateur, commerçant)",
  structure: "Structure (asso, mairie, office de tourisme…)",
};

/** Ce qu'un candidat « certifié » aimerait faire */
export const ENVIES_CERTIFIE: Record<string, string> = {
  fiche: "Remplir une fiche",
  photos: "Faire de belles photos",
  presenter: "Présenter SOS Miam aux lieux du coin",
  "big-sos": "Donner un coup de main pendant un BIG SOS",
};
