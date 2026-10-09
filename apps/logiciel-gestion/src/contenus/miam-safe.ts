import type { ActionMiamSafe } from "~/services/miam-safe.ts";

/** Les raisons d'un signalement Miam Safe (mêmes que dans l'app, packages/commun/src/regles/miam-safe.ts) */
export const RAISONS_MIAM_SAFE: Record<string, string> = {
  harcelement: "Harcèlement",
  agression: "Agression",
  discrimination: "Discrimination",
  personnel: "Quelqu'un de l'équipe du lieu",
  autre: "Autre chose",
};

export const ENDROITS_MIAM_SAFE: Record<string, string> = { salle: "En salle", terrasse: "En terrasse", toilettes: "Aux toilettes", ailleurs: "Ailleurs" };

/** Ce que l'équipe décide, et ce que ça fait */
export const ACTIONS_MIAM_SAFE: Record<ActionMiamSafe, { libelle: string; effet: string }> = {
  aucune: { libelle: "Rien à faire", effet: "Le signalement est classé. Rien ne change pour le lieu." },
  "lieu-contacte": { libelle: "Lieu contacté", effet: "Tu as appelé ou écrit au lieu. Sa charte et sa fiche restent en place." },
  "charte-retiree": {
    libelle: "Retirer la charte",
    effet: "Le badge Miam Safe disparaît et les alertes silencieuses ne partent plus. Le gérant ne pourra pas re-signer tant que tu ne lui rends pas la charte.",
  },
  "lieu-masque": { libelle: "Retirer la charte et masquer le lieu", effet: "En plus, la fiche disparaît de l'app et du site. À garder pour les faits graves." },
};
