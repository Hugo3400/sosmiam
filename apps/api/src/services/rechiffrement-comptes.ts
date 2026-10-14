// Rechiffrement des comptes après un changement de clé des données (docs/procedure-changement-cle.md) : le nom et la date
// de naissance écrits avec une ancienne clé sont relus puis réécrits avec la courante, par paquets de 500. Lancé par la
// tâche de nuit (taches/taches-de-nuit.ts) ; ne fait rien tant qu'il n'y a pas d'ancienne clé. Jamais une donnée d'un
// compte dans le journal : seulement des nombres.
import type { Prisma, PrismaClient } from "../base-de-donnees/client-genere/client.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";

export const TAILLE_PAQUET_RECHIFFREMENT = 500;

export type BilanRechiffrement = {
  /** Comptes réécrits avec la clé courante */
  rechiffres: number;
  /** Comptes qu'aucune clé ne lit (laissés tels quels, à regarder) */
  illisibles: number;
  /** Comptes encore écrits avec une ancienne clé après ce passage (0 : l'ancienne clé peut partir) */
  restants: number;
};

type Base = Pick<PrismaClient, "compte">;

/**
 * Rechiffre avec la clé courante les comptes dont le nom ou la date de naissance a été écrit avec une ancienne clé. Rend
 * des nombres ; sans ancienne clé (ou sans clé du tout), ne lit rien et rend des zéros. Un compte modifié entre la
 * lecture et l'écriture est laissé tel quel (il a été réécrit avec la clé courante, ou le sera la nuit suivante).
 */
export async function rechiffrerComptes(chiffrement: ChiffrementDonnees | null, base?: Base, taille = TAILLE_PAQUET_RECHIFFREMENT): Promise<BilanRechiffrement> {
  const bilan: BilanRechiffrement = { rechiffres: 0, illisibles: 0, restants: 0 };
  if (!chiffrement || chiffrement.versionsAnciennes.length === 0) return bilan;
  const depot = base ?? (await import("../base-de-donnees/connexion.ts")).baseDeDonnees;

  const prefixe = `v${chiffrement.versionCle}:`;
  const ancien = (champ: "nomChiffre" | "dateNaissanceChiffree"): Prisma.CompteWhereInput => ({
    AND: [{ [champ]: { not: null } }, { NOT: { [champ]: { startsWith: prefixe } } }],
  });
  const aRechiffrer: Prisma.CompteWhereInput = { OR: [ancien("nomChiffre"), ancien("dateNaissanceChiffree")] };

  let dernierId = 0;
  for (;;) {
    const paquet = await depot.compte.findMany({
      where: { AND: [{ id: { gt: dernierId } }, aRechiffrer] },
      orderBy: { id: "asc" },
      take: taille,
      select: { id: true, nomChiffre: true, dateNaissanceChiffree: true, modifieLe: true },
    });
    for (const compte of paquet) {
      dernierId = compte.id;
      const reecrire = (valeur: string | null, champ: "nom" | "dateNaissance") =>
        valeur !== null && chiffrement.estAncien(valeur) ? chiffrement.chiffrer(chiffrement.dechiffrer(valeur, champ), champ) : valeur;
      let nomChiffre: string | null;
      let dateNaissanceChiffree: string | null;
      try {
        nomChiffre = reecrire(compte.nomChiffre, "nom");
        dateNaissanceChiffree = reecrire(compte.dateNaissanceChiffree, "dateNaissance");
      } catch {
        bilan.illisibles += 1;
        continue;
      }
      // Seulement si rien n'a bougé depuis la lecture ; « modifié le » garde sa date (ce n'est pas la personne qui change)
      const { count } = await depot.compte.updateMany({
        where: { id: compte.id, nomChiffre: compte.nomChiffre, dateNaissanceChiffree: compte.dateNaissanceChiffree },
        data: { nomChiffre, dateNaissanceChiffree, modifieLe: compte.modifieLe },
      });
      bilan.rechiffres += count;
    }
    if (paquet.length < taille) break;
  }
  bilan.restants = await depot.compte.count({ where: aRechiffrer });
  return bilan;
}
