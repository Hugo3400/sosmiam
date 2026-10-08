// Les quatre catégories de lieux (mêmes valeurs que la colonne « type » de la table lieux de l'API).
import type { CategorieLieu } from "~/types/lieux";

export const categoriesLieux: { valeur: CategorieLieu; libelle: string }[] = [
  { valeur: "resto", libelle: "Restos" },
  { valeur: "patisserie", libelle: "Pâtisseries" },
  { valeur: "bar", libelle: "Bars" },
  { valeur: "sortie", libelle: "Sorties" },
];
