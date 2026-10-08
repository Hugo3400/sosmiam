import type { JetonComptoir } from "../../types/code-scanne.ts";

/**
 * Le texte du QR du comptoir : « https://sosmiam.fr/v/<version>.<lieu>.<présentation>.<fenêtre>.<mac> », nombres en
 * base 36. Lève une erreur pour un nombre négatif ou non entier : ce QR ne pourrait jamais être lu.
 */
export function construireTexteComptoir(j: JetonComptoir): string {
  const nombres = [j.lieuId, j.presentationId, j.fenetre];
  if (nombres.some((n) => !Number.isSafeInteger(n) || n < 0)) throw new Error("Jeton du comptoir invalide");
  return `https://sosmiam.fr/v/${j.version}.${nombres.map((n) => n.toString(36)).join(".")}.${j.mac}`;
}
