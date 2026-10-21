import type { BadgeCatalogue } from "../types/badge.ts";

/**
 * Le catalogue des badges, partagé par l'app et le logiciel de gestion (et plus tard le site). Donnés d'office par le
 * serveur : ceux de regles/badges-automatiques.ts (jamais retirés, jamais de points), « premier-sauveteur » (activité de
 * l'app), « deniche-par-toi » (lieu proposé et accepté dans le logiciel), « fondateur » (place de fondateur acceptée).
 * « iode » et « bande » attendent leur mesure (type de plat, sorties entre potes).
 */
export const BADGES: readonly BadgeCatalogue[] = [
  { id: "premiere-rescousse", emoji: "🛟", nom: "Première rescousse", texte: "Donne ta première rescousse à un lieu" },
  { id: "sauveteur-en-serie", emoji: "⛑️", nom: "Sauveteur en série", texte: "Donne 10 rescousses : la Brigade commence à compter sur toi" },
  { id: "second-du-capitaine", emoji: "⚓", nom: "Second du Capitaine", texte: "Donne 25 rescousses : le Capitaine Bouiboui te confie la barre" },
  { id: "heros-de-la-brigade", emoji: "🏆", nom: "Héros de la Brigade", texte: "Donne 50 rescousses : toute la Brigade te porte en triomphe" },
  { id: "coeur-sur-la-main", emoji: "💛", nom: "Cœur sur la main", texte: "Fais valider 3 visites pendant un SOS : le lieu a des tables à remplir, toi un bon appétit" },
  { id: "bonne-etoile", emoji: "🌟", nom: "Bonne étoile", texte: "Fais valider une visite dans 3 lieux différents, pendant leur SOS" },
  // Décidé le 8 octobre 2026 : la première rescousse donnée à un lieu tout juste arrivé (proposer un lieu, c'est « Déniché par toi »)
  { id: "premier-sauveteur", emoji: "🚀", nom: "Premier sauveteur", texte: "Donne la toute première rescousse à un lieu qui vient d'arriver" },
  { id: "vigie", emoji: "🔭", nom: "Vigie", texte: "Donne la toute première rescousse à 5 lieux qui viennent d'arriver : rien n'échappe à ta longue-vue" },
  { id: "deniche-par-toi", emoji: "🔎", nom: "Déniché par toi", texte: "Propose un lieu qui rejoint SOS Miam : sa fiche affichera ton prénom" },
  { id: "fondateur", emoji: "🎖️", nom: "Fondateur", texte: "Prends une place de fondateur dans ta ville" },
  { id: "fine-fourchette", emoji: "🍽️", nom: "Fine fourchette", texte: "Fais valider 10 visites au resto" },
  { id: "fourchette-d-or", emoji: "🥇", nom: "Fourchette d'or", texte: "Fais valider 25 visites au resto : les chefs te saluent bien bas" },
  { id: "tour-de-table", emoji: "🥘", nom: "Tour de table", texte: "Fais valider une visite dans 5 restos différents" },
  // Valable partout (décidé : il dépend d'un type de plat, plus d'une région)
  { id: "iode", emoji: "🦪", nom: "Iodé", texte: "Des huîtres ou des fruits de mer dégustés sur place" },
  { id: "bec-sucre", emoji: "🍬", nom: "Bec sucré", texte: "5 visites validées en pâtisserie ou confiserie" },
  { id: "creme-de-la-creme", emoji: "🍰", nom: "Crème de la crème", texte: "Fais valider 20 visites en pâtisserie ou confiserie" },
  { id: "as-du-gouter", emoji: "🧁", nom: "As du goûter", texte: "Fais valider une visite dans 5 pâtisseries ou confiseries différentes" },
  { id: "habitue", emoji: "💯", nom: "Habitué", texte: "Fais valider 25 visites : on commence à bien te connaître" },
  { id: "mordu-de-miam", emoji: "🎣", nom: "Mordu de miam", texte: "Fais valider 50 visites : tu as mordu à l'hameçon" },
  { id: "legende-du-miam", emoji: "👑", nom: "Légende du miam", texte: "Fais valider 100 visites : les Miamis parlent de toi jusqu'en cuisine" },
  { id: "serie-4", emoji: "🔥", nom: "4 semaines d'affilée", texte: "Une visite validée par semaine pendant 4 semaines" },
  { id: "saison-complete", emoji: "🗓️", nom: "Saison complète", texte: "Fais valider une visite chaque semaine, 12 semaines d'affilée" },
  { id: "marathon-du-miam", emoji: "🏃", nom: "Marathon du miam", texte: "Fais valider une visite chaque semaine, 26 semaines d'affilée : six mois sans lâcher la fourchette" },
  { id: "un-an-de-miam", emoji: "🎂", nom: "Un an de miam", texte: "Fais valider une visite chaque semaine, 52 semaines d'affilée : ça se fête, avec du gâteau" },
  // Décidé le 14 octobre 2026 : tous les lieux, plus « 3 bars » (loi Évin)
  { id: "noctambule", emoji: "🌙", nom: "Noctambule", texte: "3 visites validées après 22 h" },
  { id: "fureteur", emoji: "🗺️", nom: "Fureteur", texte: "Fais valider une visite dans 10 lieux différents" },
  { id: "explorateur", emoji: "🧭", nom: "Explorateur", texte: "Des visites validées dans 5 villes différentes" },
  { id: "baroudeur", emoji: "🎒", nom: "Baroudeur", texte: "Fais valider des visites dans 10 villes différentes : ta fourchette voit du pays" },
  { id: "bande", emoji: "👯", nom: "Toute la bande", texte: "Une sortie entre potes validée à 4 ou plus" },
  { id: "premiere-plume", emoji: "📝", nom: "Première plume", texte: "Publie ton premier avis après une visite validée" },
  { id: "plume-de-la-brigade", emoji: "🪶", nom: "Plume de la Brigade", texte: "Publie 5 avis après tes visites validées" },
  { id: "plume-d-or", emoji: "🖋️", nom: "Plume d'or", texte: "Publie 20 avis après tes visites validées : les lieux te lisent avec gourmandise" },
  { id: "oeil-de-chef", emoji: "📸", nom: "Œil de chef", texte: "Publie 5 avis avec une photo de ce que tu as dégusté" },
  { id: "objectif-gourmand", emoji: "🖼️", nom: "Objectif gourmand", texte: "Publie 20 avis avec une photo : ton assiette a trouvé son photographe" },
  { id: "chasseur-de-bugs", emoji: "🐞", nom: "Chasseur de bugs", texte: "Signale une vraie faille de sécurité sur la page Chasse aux bugs : la Brigade te doit une fière chandelle" },
];
