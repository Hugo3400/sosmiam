// Une suggestion « Tu pourrais suivre » : une personne, un créateur ou un lieu, avec la raison qu'on te donne.
// Calculée sur le téléphone en attendant l'API (voir utiliserSuggestionsSuivi et docs/decisions.md, « Suivre et abonnements »).
import type { Href } from "expo-router";

export type TypeSuggestion = "personne" | "createur" | "lieu";

export type Suggestion = {
  /** Clé de suivi : « personne:<id> », « createur:<pseudo> » ou « lieu:<id> » (aussi celle qu'on masque) */
  cle: string;
  type: TypeSuggestion;
  /** Avatar d'une personne, 🎬 pour un créateur, emoji d'un lieu */
  emoji: string;
  /** Prénom d'une personne, « @pseudo » d'un créateur, nom d'un lieu (lu par VoiceOver et dans les annonces) */
  nom: string;
  /** « Pote de Léa et 2 autres », « Créateur à Montpellier », « À 350 m »… */
  raison: string;
  /** Dégradé d'un lieu, pour son rond */
  degrade?: [string, string];
  /** Ce que la carte ouvre : son profil, sa page ou sa fiche */
  ouvrir: Href;
};
