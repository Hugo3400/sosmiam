/** Découpe une ligne de CSV (séparateur « ; », champs entre guillemets possibles, "" pour un guillemet). */
export function lireLigneCsv(ligne: string, separateur = ";"): string[] {
  const champs: string[] = [];
  let champ = "";
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const caractere = ligne[i];
    if (entreGuillemets) {
      if (caractere === '"' && ligne[i + 1] === '"') {
        champ += '"';
        i++;
      } else if (caractere === '"') entreGuillemets = false;
      else champ += caractere;
    } else if (caractere === '"') entreGuillemets = true;
    else if (caractere === separateur) {
      champs.push(champ);
      champ = "";
    } else champ += caractere;
  }
  champs.push(champ);
  return champs;
}
