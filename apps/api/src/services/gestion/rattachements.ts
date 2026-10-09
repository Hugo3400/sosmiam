// Rattachements d'un compte pro à son lieu (docs/decisions.md, « Espace pro ») : l'équipe valide les demandes de
// gérant ; un lieu est « vérifié ✓ » dès qu'il a un rattachement validé. Les membres d'équipe (invités par le gérant)
// ne passent pas par ici, mais se voient dans la fiche du lieu, et peuvent être retirés.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

const LIEU = { id: true, nom: true, emoji: true, ville: true, adresse: true, siteWeb: true, telephone: true, statut: true } as const;
const COMPTE = { id: true, prenom: true, email: true, emailVerifieLe: true } as const;

/** Les demandes d'un statut (« en-attente », « valide », « refuse », « retire » ; vide : toutes), d'un rôle, ou d'un lieu. */
export async function listerRattachements({ statut, role, lieuId }: { statut: string; role: string; lieuId: number | null }) {
  return baseDeDonnees.rattachementLieu.findMany({
    where: { ...(statut ? { statut } : {}), ...(role ? { role } : {}), ...(lieuId ? { lieuId } : {}) },
    orderBy: { creeLe: statut === "en-attente" ? "asc" : "desc" },
    take: 300,
    include: { lieu: { select: LIEU }, compte: { select: COMPTE } },
  });
}

export type DecisionRattachement = "valider" | "refuser" | "retirer";

/**
 * Valider ou refuser une demande de gérant en attente, ou retirer un rattachement validé (gérant ou équipe). Rend de quoi
 * prévenir la personne, ou null si rien ne correspond (déjà décidé, ou mauvais état).
 */
export async function deciderRattachement(id: number, decision: DecisionRattachement, reponse: string | null, maintenant = new Date()) {
  const avant = decision === "retirer" ? { statut: "valide" } : { statut: "en-attente", role: "gerant" };
  const statut = decision === "valider" ? "valide" : decision === "refuser" ? "refuse" : "retire";
  const rattachement = await baseDeDonnees.rattachementLieu.findFirst({ where: { id, ...avant }, select: { compteId: true, lieuId: true, lieu: { select: { nom: true } } } });
  if (!rattachement) return null;
  const { count } = await baseDeDonnees.rattachementLieu.updateMany({ where: { id, ...avant }, data: { statut, reponse, decideLe: maintenant } });
  return count > 0 ? { statut, compteId: rattachement.compteId, lieuId: rattachement.lieuId, nomLieu: rattachement.lieu.nom } : null;
}
