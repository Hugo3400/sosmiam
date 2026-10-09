import { readFileSync } from "node:fs";

/** Grande liste publique de mots de passe courants (source, licence et date en tête du fichier) */
const FICHIER = new URL("../../donnees/mots-de-passe-courants.txt", import.meta.url);
const SIGNES = /[\p{P}\p{S}]+/gu;
const CHIFFRES_AUX_BOUTS = /^\p{N}+|\p{N}+$/gu;

let liste: Set<string> | undefined;

/**
 * Les mots de passe courants, en minuscules et sans espaces, lus à la première demande puis gardés en mémoire (une
 * dizaine de milliers, environ 80 Ko). Chacun y est aussi sans ses signes, puis sans les chiffres du début et de la fin
 * (« p@ssw0rd » donne aussi « pssw0rd ») : validerMotDePasse compare ces mêmes formes du mot de passe tapé. Les formes de
 * moins de 6 caractères sont laissées de côté (elles refuseraient à tort des phrases comme « Ah ! » entourées de chiffres).
 */
export function chargerMotsDePasseCourants(): Set<string> {
  if (liste) return liste;
  const formes = new Set<string>();
  for (const ligne of readFileSync(FICHIER, "utf8").split("\n")) {
    const mot = ligne.trim();
    if (mot === "" || mot.startsWith("#")) continue;
    const sansSignes = mot.replace(SIGNES, "");
    for (const forme of [mot, sansSignes, sansSignes.replace(CHIFFRES_AUX_BOUTS, "")]) if (forme.length >= 6) formes.add(forme);
  }
  liste = formes;
  return liste;
}
