// Libellés du programme Ambassadeurs (règles : packages/commun/src/regles/ambassadeurs.ts, docs/decisions.md).
import type { Palier, StatutAmbassadeur } from "~/services/ambassadeurs.ts";

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
  "premier-sauveteur": "🛟 Premier sauveteur",
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
