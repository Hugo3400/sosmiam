/**
 * Un fichier CSV en tableau de lignes : séparateur deviné sur la première ligne (« ; » comme Excel en français, sinon
 * « , » ou tabulation), champs entre guillemets (avec « "" » pour un guillemet), retours à la ligne Windows, marque BOM.
 * Les lignes vides sont ignorées.
 */
export function lireCsv(texte: string): string[][] {
  const contenu = texte.replace(/^﻿/, "");
  const premiere = contenu.split(/\r?\n/, 1)[0] ?? "";
  const separateur = [";", ",", "\t"].map((s) => [s, premiere.split(s).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let champ = "";
  let entreGuillemets = false;
  for (let i = 0; i < contenu.length; i++) {
    const c = contenu[i]!;
    if (entreGuillemets) {
      if (c === '"' && contenu[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') entreGuillemets = false;
      else champ += c;
    } else if (c === '"' && champ === "") entreGuillemets = true;
    else if (c === separateur) { ligne.push(champ); champ = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && contenu[i + 1] === "\n") i++;
      ligne.push(champ);
      if (ligne.some((valeur) => valeur.trim())) lignes.push(ligne);
      ligne = [];
      champ = "";
    } else champ += c;
  }
  ligne.push(champ);
  if (ligne.some((valeur) => valeur.trim())) lignes.push(ligne);
  return lignes;
}
