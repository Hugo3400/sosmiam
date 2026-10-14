// File des demandes de lieux dans le logiciel de gestion : accepter (une fiche est créée) ou refuser.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { LieuSaisi } from "./lieux.ts";

export async function listerDemandes(statut: string) {
  const [demandes, compteurs] = await Promise.all([
    baseDeDonnees.demandeLieu.findMany({ where: statut ? { statut } : {}, orderBy: { creeLe: statut === "a-traiter" ? "asc" : "desc" }, take: 200 }),
    baseDeDonnees.demandeLieu.groupBy({ by: ["statut"], _count: { _all: true } }),
  ]);
  return { compteurs: Object.fromEntries(compteurs.map((g) => [g.statut, g._count._all])), demandes };
}

/** Accepte une demande : la fiche saisie (préremplie depuis la demande) est créée, et la demande y est reliée. */
export async function accepterDemande(id: number, lieu: LieuSaisi, reponse: string | null) {
  const demande = await baseDeDonnees.demandeLieu.findUnique({ where: { id } });
  if (!demande || demande.statut !== "a-traiter") return null;
  // Proposé depuis l'espace ambassadeur : « Déniché par » son prénom (si la fiche n'en a pas déjà un)
  const auteur = demande.compteId ? await baseDeDonnees.compte.findUnique({ where: { id: demande.compteId }, select: { prenom: true } }) : null;
  const cree = await baseDeDonnees.$transaction(async (transaction) => {
    const nouveau = await transaction.lieu.create({ data: { ...lieu, decouvertPar: lieu.decouvertPar ?? auteur?.prenom ?? null } });
    await transaction.demandeLieu.update({ where: { id }, data: { statut: "acceptee", lieuId: nouveau.id, reponse, traiteLe: new Date() } });
    return nouveau;
  });
  return { ...cree, compteIdAuteur: auteur ? demande.compteId : null };
}

export async function refuserDemande(id: number, reponse: string | null) {
  const { count } = await baseDeDonnees.demandeLieu.updateMany({
    where: { id, statut: "a-traiter" },
    data: { statut: "refusee", reponse, traiteLe: new Date() },
  });
  return count > 0;
}

/**
 * Efface les demandes de lieu entières (contact compris) au bout de 3 ans : décidées depuis 3 ans, ou jamais traitées depuis
 * 3 ans, comme le promet la politique de confidentialité (audit du 14 octobre 2026 : avant, seul le contact partait). Le lieu
 * créé à partir d'une demande acceptée reste. Rend le nombre de demandes effacées.
 */
export async function effacerContactsAnciens(maintenant = new Date()): Promise<number> {
  const limite = new Date(maintenant.getTime() - 3 * 365 * 86_400_000);
  const { count } = await baseDeDonnees.demandeLieu.deleteMany({
    where: { OR: [{ traiteLe: { lt: limite } }, { traiteLe: null, creeLe: { lt: limite } }] },
  });
  return count;
}

/** Efface les coordonnées du contact d'une demande (fin de l'échange, ou demande de la personne). */
export async function effacerContactDemande(id: number) {
  const { count } = await baseDeDonnees.demandeLieu.updateMany({
    where: { id },
    data: { contactNom: null, contactEmail: null, contactTelephone: null },
  });
  return count > 0;
}
