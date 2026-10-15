// Les limitations vues par l'équipe (lecture seule) : celles qui courent ou vont commencer, avec le prénom et le pseudo du
// compte pour s'y retrouver. Décider, lever et réexaminer passent par services/limitations-comptes.ts (session Site).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export async function listerLimitationsEnCours(maintenant = new Date()) {
  return baseDeDonnees.limitationCompte.findMany({
    where: { leveeLe: null, OR: [{ fin: null }, { fin: { gt: maintenant } }] },
    orderBy: { debut: "desc" },
    take: 200,
    select: {
      id: true, compteId: true, motif: true, motivation: true, debut: true, fin: true, contesteLe: true, reexamineLe: true, creeLe: true,
      compte: { select: { prenom: true, pseudo: true } },
    },
  });
}
