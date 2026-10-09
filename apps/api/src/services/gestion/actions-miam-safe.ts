// Ce que l'équipe peut décider sur un signalement Miam Safe (à part : les contrôleurs le lisent sans ouvrir la base).
export const ACTIONS_MIAM_SAFE = ["aucune", "lieu-contacte", "charte-retiree", "lieu-masque"] as const;
export type ActionMiamSafe = (typeof ACTIONS_MIAM_SAFE)[number];
