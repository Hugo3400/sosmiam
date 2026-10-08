/**
 * « chez » devant le nom d'un lieu, sans bégayer : « chez Sucre & Garrigue », mais « chez Nonna Lia » pour « Chez Nonna Lia »
 * et « aux Pâtés de Lucette » pour « Aux Pâtés de Lucette ». Pour finir une phrase : « Tu es chez Nonna Lia ? ».
 */
export function direChezLieu(nom: string): string {
  const debut = /^(chez|aux|au)\s+/i.exec(nom);
  if (!debut) return `chez ${nom}`;
  return `${debut[1].toLowerCase()} ${nom.slice(debut[0].length)}`;
}
