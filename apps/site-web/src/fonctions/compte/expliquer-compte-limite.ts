import { decrireFinLimitation } from "./decrire-fin-limitation.ts";

/**
 * Le message d'une page qui écrit, quand l'API répond 403 « compte-limite » (details.jusqua) : rien n'est parti, pourquoi,
 * et où lire le motif et contester. `lienMonCompte` : l'adresse de « Mon compte » sur cet espace.
 */
export function expliquerCompteLimite(jusqua: string | null | undefined, lienMonCompte = "Mon compte"): string {
  return `Rien n'est parti : ton compte est limité ${decrireFinLimitation(jusqua)}. Tant que ça dure, ce que les autres verraient attend ; tout le reste marche comme d'habitude. Le pourquoi est dans « ${lienMonCompte} », et tu peux y contester.`;
}
