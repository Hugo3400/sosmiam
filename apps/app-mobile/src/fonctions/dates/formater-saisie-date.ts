/** Met en forme une date tapée au clavier : on garde les chiffres et on ajoute les « / » tout seuls (« 12032004 » → « 12/03/2004 »). */
export function formaterSaisieDate(texte: string): string {
  const chiffres = texte.replace(/\D/g, "").slice(0, 8);
  if (chiffres.length <= 2) return chiffres;
  if (chiffres.length <= 4) return `${chiffres.slice(0, 2)}/${chiffres.slice(2)}`;
  return `${chiffres.slice(0, 2)}/${chiffres.slice(2, 4)}/${chiffres.slice(4)}`;
}
