/** Caractères invisibles qui retournent ou cachent du texte (sens d'écriture, espaces sans largeur) */
const INVISIBLES = /[​‎‏‪-‮⁦-⁩﻿]/g;
const CONTROLE = /[\u0000-\u001F\u007F-\u009F]/g;

/**
 * Une ligne de texte propre (prénom, ville, quartier) : normalisée (NFC), sans caractère de contrôle ni caractère
 * invisible, espaces et sauts de ligne réduits à un seul espace, sans espace au début ni à la fin.
 */
export function nettoyerLigne(texte: string): string {
  return texte.normalize("NFC").replace(INVISIBLES, "").replace(CONTROLE, " ").replace(/\s+/g, " ").trim();
}
