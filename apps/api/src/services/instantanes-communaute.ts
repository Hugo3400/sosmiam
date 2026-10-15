import type { AuteurInstantane } from "../fonctions/social/construire-instantane.ts";
import type { RelationsSociales, TransactionSociale } from "./relations-sociales-regles.ts";
import type { ContenuLu } from "./signalements-sociaux-regles.ts";

export type CibleCommunaute = "idee" | "comment-idee" | "miamis";
export type VoirSortieMiamis = (compteId: number, sortieId: number, maintenant: Date) => Promise<boolean>;
export type DependancesInstantanesCommunaute = { relations: Pick<RelationsSociales, "bloqueEntre">; voitLaSortieMiamis?: VoirSortieMiamis };

const vide = { lieuId: null, fichierMedia: null };

async function lireAuteur(tx: TransactionSociale, compteId: number | null): Promise<AuteurInstantane> {
  if (compteId === null) return null;
  const compte = await tx.compte.findUnique({ where: { id: compteId }, select: { pseudo: true, prenom: true } });
  return compte ? { pseudo: compte.pseudo, prenom: compte.prenom } : null;
}

async function bloque(tx: TransactionSociale, d: DependancesInstantanesCommunaute, compteId: number, auteurId: number | null): Promise<boolean> {
  return auteurId !== null && auteurId !== compteId && (await d.relations.bloqueEntre(compteId, auteurId, tx));
}

const estIdeePubliee = (i: { statut: string; suspendueLe: Date | null; retireeLe: Date | null }) => i.statut !== "en-relecture" && i.suspendueLe === null && i.retireeLe === null;

async function lireIdee(tx: TransactionSociale, d: DependancesInstantanesCommunaute, compteId: number, id: number): Promise<ContenuLu | null> {
  const i = await tx.ideeCommunaute.findUnique({ where: { id }, select: { auteurId: true, titre: true, detail: true, statut: true, suspendueLe: true, retireeLe: true, creeLe: true } });
  if (!i || !estIdeePubliee(i) || (await bloque(tx, d, compteId, i.auteurId))) return null;
  return { contenu: { cible: "idee", titre: i.titre, detail: i.detail, statut: i.statut, auteur: await lireAuteur(tx, i.auteurId), date: i.creeLe }, auteurContenuId: i.auteurId, ...vide };
}

async function lireCommentaire(tx: TransactionSociale, d: DependancesInstantanesCommunaute, compteId: number, id: number): Promise<ContenuLu | null> {
  const c = await tx.commentaireIdeeCommunaute.findUnique({
    where: { id },
    select: { ideeId: true, auteurId: true, texte: true, reponseAId: true, masqueLe: true, suspenduLe: true, retireLe: true, creeLe: true, idee: { select: { statut: true, suspendueLe: true, retireeLe: true, auteurId: true } } },
  });
  if (!c || c.masqueLe || c.suspenduLe || c.retireLe || !estIdeePubliee(c.idee)) return null;
  if ((await bloque(tx, d, compteId, c.auteurId)) || (await bloque(tx, d, compteId, c.idee.auteurId))) return null;
  return {
    contenu: { cible: "comment-idee", texte: c.texte, ideeId: c.ideeId, reponseA: c.reponseAId, auteur: await lireAuteur(tx, c.auteurId), date: c.creeLe },
    auteurContenuId: c.auteurId, ...vide,
  };
}

async function lireSortie(tx: TransactionSociale, d: DependancesInstantanesCommunaute, compteId: number, id: number, maintenant: Date): Promise<ContenuLu | null> {
  const s = await tx.sortieDesMiamis.findUnique({
    where: { id },
    select: {
      organisateurId: true, lieuId: true, titre: true, description: true, quand: true, annuleeLe: true, retireeLe: true,
      etiquettes: { where: { officielle: false, retireeLe: null }, select: { nom: true }, orderBy: { nom: "asc" } },
      participations: { where: { compteId }, select: { statut: true } },
    },
  });
  if (!s || s.annuleeLe || s.retireeLe || (await bloque(tx, d, compteId, s.organisateurId))) return null;
  const voit = s.organisateurId === compteId || s.participations.length > 0 || (d.voitLaSortieMiamis ? await d.voitLaSortieMiamis(compteId, id, maintenant) : false);
  if (!voit) return null;
  return {
    contenu: {
      cible: "miamis", titre: s.titre, description: s.description, quand: s.quand, lieuId: s.lieuId, etiquettesLibres: s.etiquettes.map((e) => e.nom),
      organisateur: await lireAuteur(tx, s.organisateurId),
    },
    auteurContenuId: s.organisateurId, lieuId: s.lieuId, fichierMedia: null,
  };
}

export function lireContenuCommunaute(tx: TransactionSociale, d: DependancesInstantanesCommunaute, compteId: number, cible: CibleCommunaute, id: number, maintenant: Date): Promise<ContenuLu | null> {
  if (cible === "idee") return lireIdee(tx, d, compteId, id);
  if (cible === "comment-idee") return lireCommentaire(tx, d, compteId, id);
  return lireSortie(tx, d, compteId, id, maintenant);
}

export async function masquerCommunautePourTous(tx: TransactionSociale, cible: "idee" | "comment-idee", id: number, maintenant: Date): Promise<void> {
  if (cible === "idee") await tx.ideeCommunaute.updateMany({ where: { id, suspendueLe: null }, data: { suspendueLe: maintenant } });
  else await tx.commentaireIdeeCommunaute.updateMany({ where: { id, suspenduLe: null }, data: { suspenduLe: maintenant } });
}
