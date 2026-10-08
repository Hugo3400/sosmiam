// Types de lieux proposés dans le formulaire de /proposer-lieu (5 au plus, pour rester lisible).
export const TYPES_LIEUX = [
  { valeur: "resto", libelle: "Resto", emoji: "🍽️" },
  { valeur: "patisserie", libelle: "Pâtisserie, boulangerie", emoji: "🥐" },
  { valeur: "cafe-bar", libelle: "Café, bar, cave", emoji: "☕" },
  { valeur: "sortie", libelle: "Sortie, activité, salle", emoji: "🎳" },
  { valeur: "autre", libelle: "Autre pépite", emoji: "✨" },
] as const;

export type TypeLieu = (typeof TYPES_LIEUX)[number];
