// Pseudos libérés, réservés 30 jours, dans la base (table pseudos_reserves) : règles dans pseudos-reserves-regles.ts.
// Prudence : tant que la table n'existe pas (migration pas encore appliquée), rien n'est réservé et rien ne plante.
// Jamais de pseudo dans un journal.
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { normaliserPseudo } from "../fonctions/comptes/normaliser-pseudo.ts";
import { calculerFinReservation, type EstPseudoReserve, type RaisonReservationPseudo } from "./pseudos-reserves-regles.ts";

type Client = Prisma.TransactionClient | typeof baseDeDonnees;

/** Vrai une fois la table vue (gardé pour tout le processus) ; absente : on revérifie à chaque appel, c'est une requête légère */
let tableVue = false;

/** Vrai si la table pseudos_reserves existe (dans le schéma de la connexion) */
export async function tablePseudosReservesPresente(): Promise<boolean> {
  if (tableVue) return true;
  const [ligne] = await baseDeDonnees.$queryRaw<{ presente: boolean }[]>`SELECT to_regclass('pseudos_reserves') IS NOT NULL AS presente`;
  tableVue = ligne?.presente === true;
  return tableVue;
}

/** La réservation encore valable de ce pseudo : le compte qui peut le reprendre (null : personne), ou null s'il n'y en a pas */
export async function lireReservationActive(client: Client, pseudo: string, maintenant: Date): Promise<{ compteId: number | null } | null> {
  return client.pseudoReserve.findFirst({ where: { pseudo, reserveJusquLe: { gt: maintenant } }, select: { compteId: true } });
}

/** Réserve 30 jours ce pseudo libéré (une réservation existante est remplacée et prolongée). */
export async function reserverPseudoDans(
  client: Client, pseudo: string, compteId: number | null, raison: RaisonReservationPseudo, maintenant: Date,
): Promise<void> {
  const ligne = { compteId, raison, reserveJusquLe: calculerFinReservation(maintenant), creeLe: maintenant };
  await client.pseudoReserve.upsert({ where: { pseudo }, create: { pseudo, ...ligne }, update: ligne });
}

/** Vrai si ce pseudo est réservé pour un AUTRE compte que `compteId` (ou pour personne : compte supprimé), pas expiré. */
export async function estReservePourUnAutre(client: Client, pseudo: string, compteId: number | undefined, maintenant: Date): Promise<boolean> {
  const reservation = await lireReservationActive(client, pseudo, maintenant);
  return reservation !== null && (reservation.compteId === null || reservation.compteId !== compteId);
}

/**
 * Pour la session App (POST /app/bande/rejoindre, « Ce lien a changé ») : vrai si le pseudo est réservé, pas expiré, et
 * qu'aucun compte ne le porte aujourd'hui. Ne dit jamais à qui il appartenait.
 */
export const estPseudoReserve: EstPseudoReserve = async (pseudo, maintenant = new Date()) => {
  const forme = normaliserPseudo(pseudo);
  if (forme === "" || !(await tablePseudosReservesPresente())) return false;
  if (!(await lireReservationActive(baseDeDonnees, forme, maintenant))) return false;
  return (await baseDeDonnees.compte.findUnique({ where: { pseudo: forme }, select: { id: true } })) === null;
};

/** Ménage de nuit : efface les réservations expirées ; rend leur nombre (rien d'autre pour le journal). */
export async function effacerPseudosReservesExpires(maintenant = new Date()): Promise<number> {
  if (!(await tablePseudosReservesPresente())) return 0;
  const { count } = await baseDeDonnees.pseudoReserve.deleteMany({ where: { reserveJusquLe: { lte: maintenant } } });
  return count;
}
