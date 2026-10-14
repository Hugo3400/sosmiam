import type { BadgeCatalogue } from "../types/badge.ts";

/**
 * Le catalogue des badges, partagé par l'app et le logiciel de gestion (et plus tard le site). Donnés d'office par le
 * serveur : ceux de regles/badges-automatiques.ts (jamais retirés, jamais de points), « premier-sauveteur » (activité de
 * l'app), « deniche-par-toi » (lieu proposé et accepté dans le logiciel), « fondateur » (place de fondateur acceptée).
 * « iode » et « bande » attendent leur mesure (type de plat, sorties entre potes).
 */
export const BADGES: readonly BadgeCatalogue[] = [
  { id: "premiere-rescousse", emoji: "🛟", nom: "Première rescousse", texte: "Donne ta première rescousse à un lieu" },
  // Décidé le 8 octobre 2026 : la première rescousse donnée à un lieu tout juste arrivé (proposer un lieu, c'est « Déniché par toi »)
  { id: "premier-sauveteur", emoji: "🚀", nom: "Premier sauveteur", texte: "Donne la toute première rescousse à un lieu qui vient d'arriver" },
  { id: "deniche-par-toi", emoji: "🔎", nom: "Déniché par toi", texte: "Propose un lieu qui rejoint SOS Miam : sa fiche affichera ton prénom" },
  { id: "fondateur", emoji: "🎖️", nom: "Fondateur", texte: "Prends une place de fondateur dans ta ville" },
  { id: "bec-sucre", emoji: "🍬", nom: "Bec sucré", texte: "5 visites validées en pâtisserie ou confiserie" },
  { id: "serie-4", emoji: "🔥", nom: "4 semaines d'affilée", texte: "Une visite validée par semaine pendant 4 semaines" },
  // Valable partout (décidé : il dépend d'un type de plat, plus d'une région)
  { id: "iode", emoji: "🦪", nom: "Iodé", texte: "Des huîtres ou des fruits de mer dégustés sur place" },
  // Décidé le 14 octobre 2026 : tous les lieux, plus « 3 bars » (loi Évin)
  { id: "noctambule", emoji: "🌙", nom: "Noctambule", texte: "3 visites validées après 22 h" },
  { id: "explorateur", emoji: "🧭", nom: "Explorateur", texte: "Des visites validées dans 5 villes différentes" },
  { id: "bande", emoji: "👯", nom: "Toute la bande", texte: "Une sortie entre potes validée à 4 ou plus" },
];
