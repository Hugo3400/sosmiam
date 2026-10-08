// Catégories des réponses types (logiciel de gestion). À part de reponses-types.ts pour être lues sans ouvrir la base.
export const CATEGORIES_REPONSES = ["demande", "ambassadeur", "moderation", "lieu", "createur", "autre"] as const;
export type CategorieReponse = (typeof CATEGORIES_REPONSES)[number];
