/** Noms communs masculins qui ouvrent souvent le nom d'un lieu : on y va « au » (« au Restaurant du Capitaine Bouiboui ») */
const NOM_COMMUN_MASCULIN = /^(restaurant|resto|bistrot|bistro|café|bar)\s/i;

/**
 * « chez » devant le nom d'un lieu, sans bégayer : « chez Sucre & Garrigue », mais « chez Nonna Lia » pour « Chez Nonna Lia »,
 * « aux Pâtés de Lucette » pour « Aux Pâtés de Lucette » et « au Restaurant du Capitaine Bouiboui ». Pour finir une
 * phrase : « Tu es chez Nonna Lia ? ».
 */
export function direChezLieu(nom: string): string {
  if (NOM_COMMUN_MASCULIN.test(nom)) return `au ${nom}`;
  const debut = /^(chez|aux|au)\s+/i.exec(nom);
  if (!debut) return `chez ${nom}`;
  return `${debut[1].toLowerCase()} ${nom.slice(debut[0].length)}`;
}
