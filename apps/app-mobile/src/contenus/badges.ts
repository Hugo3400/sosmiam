import type { MesureActivite } from "~/contenus/type-mesure-activite";

export type Badge = {
  id: string;
  emoji: string;
  nom: string;
  /** Comment on l'obtient */
  texte: string;
  /** Mesure suivie sur le téléphone ; sans mesure, le badge attend les visites validées (API) */
  mesure?: { type: MesureActivite; objectif: number };
};

/** Le catalogue des badges (repris du prototype). */
export const badges: Badge[] = [
  { id: "premiere-rescousse", emoji: "🛟", nom: "Première rescousse", texte: "Tu as sauvé ton premier lieu", mesure: { type: "rescousses", objectif: 1 } },
  {
    id: "premier-sauveteur",
    emoji: "🚀",
    nom: "Premier sauveteur",
    texte: "Tu as été le premier à faire découvrir un lieu",
    mesure: { type: "premiers-sauvetages", objectif: 1 },
  },
  { id: "bec-sucre", emoji: "🍬", nom: "Bec sucré", texte: "5 pâtisseries ou confiseries validées" },
  { id: "serie-4", emoji: "🔥", nom: "4 semaines d'affilée", texte: "Une visite validée par semaine pendant 4 semaines" },
  { id: "iode", emoji: "🦪", nom: "Iodé", texte: "Des huîtres de Bouzigues dégustées sur place" },
  { id: "noctambule", emoji: "🌙", nom: "Noctambule", texte: "3 bars validés après 22 h" },
  { id: "explorateur", emoji: "🧭", nom: "Explorateur de l'Hérault", texte: "Des visites dans 5 communes différentes" },
  { id: "bande", emoji: "👯", nom: "Toute la bande", texte: "Une sortie entre potes validée à 4 ou plus" },
];
