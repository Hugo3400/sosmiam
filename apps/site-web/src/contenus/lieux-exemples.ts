// Lieux INVENTÉS pour montrer le principe avant le lancement.
// Ils sont présentés comme des exemples sur le site ; ils seront remplacés par les vrais lieux venus de l'API.

export type TypeLieu = "resto" | "patisserie" | "bar" | "sortie";

export type LieuExemple = {
  id: number;
  nom: string;
  type: TypeLieu;
  emoji: string;
  quartier: string;
  ville: string;
  info: string;
  couleurs: [string, string];
  rescousses: number;
  alerte?: string;
};

export const typesLieux: { valeur: TypeLieu | "tous"; libelle: string }[] = [
  { valeur: "tous", libelle: "Tout" },
  { valeur: "resto", libelle: "Restos" },
  { valeur: "patisserie", libelle: "Pâtisseries" },
  { valeur: "bar", libelle: "Bars" },
  { valeur: "sortie", libelle: "Sorties" },
];

export const lieuxExemples: LieuExemple[] = [
  { id: 0, nom: "Chez Nonna Lia", type: "resto", emoji: "🍝", quartier: "Écusson", ville: "Montpellier", info: "Trattoria", couleurs: ["#FF6B5B", "#C9184A"], rescousses: 214, alerte: "Salle calme ce soir" },
  { id: 1, nom: "Sucre & Garrigue", type: "patisserie", emoji: "🍬", quartier: "Comédie", ville: "Montpellier", info: "Confiserie artisanale", couleurs: ["#FFC94A", "#FB8500"], rescousses: 87, alerte: "Fournée du soir à -30 %" },
  { id: 2, nom: "La Figue Pressée", type: "bar", emoji: "🍹", quartier: "Figuerolles", ville: "Montpellier", info: "Bar à cocktails", couleurs: ["#8F5CFF", "#3A86FF"], rescousses: 56 },
  { id: 7, nom: "La Clé des Ruelles", type: "sortie", emoji: "🗝️", quartier: "Saint-Roch", ville: "Montpellier", info: "Escape game", couleurs: ["#FFB703", "#6A4C93"], rescousses: 73, alerte: "Créneau libre à 20h" },
  { id: 9, nom: "La Tielle de Pépita", type: "resto", emoji: "🐙", quartier: "Quartier Haut", ville: "Sète", info: "Tielles & poulpe", couleurs: ["#F77F00", "#D62828"], rescousses: 121 },
  { id: 11, nom: "Aux Pâtés de Lucette", type: "patisserie", emoji: "🥧", quartier: "Centre historique", ville: "Pézenas", info: "Petits pâtés", couleurs: ["#E9C46A", "#BC6C25"], rescousses: 47 },
  { id: 5, nom: "Le Verre Tordu", type: "bar", emoji: "🍷", quartier: "Antigone", ville: "Montpellier", info: "Bar à vins nature", couleurs: ["#B5172B", "#6A040F"], rescousses: 98, alerte: "Tables libres ce soir" },
  { id: 6, nom: "Les Pagaies du Lez", type: "sortie", emoji: "🛶", quartier: "Port Marianne", ville: "Montpellier", info: "Kayak sur le Lez", couleurs: ["#4CC9F0", "#3A0CA3"], rescousses: 64 },
];
