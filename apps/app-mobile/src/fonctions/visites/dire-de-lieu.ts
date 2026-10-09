import { eliderDe } from "~/fonctions/texte/elider-de";

/** Noms communs masculins qui ouvrent souvent le nom d'un lieu : on les accorde comme s'ils avaient « le » devant */
const NOM_COMMUN_MASCULIN = /^(restaurant|resto|bistrot|bistro|café|bar)\s/i;

/**
 * « de » devant le nom d'un lieu, contracté comme à l'oral : « du Chou Rieur » (et pas « de Le Chou Rieur »), « des Baos
 * de Mei », « des Pâtés de Lucette » pour « Aux Pâtés de Lucette », « d'Émile », « de Chez Nonna Lia », « de La Figue Pressée »,
 * « du Restaurant du Capitaine Bouiboui ».
 */
export function direDeLieu(nom: string): string {
  if (NOM_COMMUN_MASCULIN.test(nom)) return `du ${nom}`;
  const article = /^(le|les|au|aux)\s+/i.exec(nom);
  if (!article) return eliderDe(nom);
  const mot = article[1].toLowerCase();
  return `${mot === "le" || mot === "au" ? "du" : "des"} ${nom.slice(article[0].length)}`;
}
