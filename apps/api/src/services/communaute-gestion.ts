import type { StatutIdee } from "../../../../packages/commun/src/types/idees.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { NouvelleNotificationCloche } from "./effets-sociaux-regles.ts";
import { retirerSortieMiamisDans } from "./communaute-moderation.ts";
import { creerStockageMediasChat, type StockageMediasChat } from "./stockage-medias-chat.ts";

export type IdeeGestion = {
  id: number;
  titre: string;
  detail: string;
  statut: StatutIdee;
  auteur: { pseudo: string | null; prenom: string } | null;
  votes: number;
  commentaires: number;
  reponseBrigade: string | null;
  reponduLe: Date | null;
  ideeDuMois: string | null;
  suspendue: boolean;
  retiree: boolean;
  publieeLe: Date | null;
  creeLe: Date;
};

export type ResultatGestionCommunaute = { ok: true; notifications: NouvelleNotificationCloche[] } | { ok: false; erreur: "introuvable" | "champ-invalide" };

const STATUTS: readonly StatutIdee[] = ["en-relecture", "proposee", "a-l-etude", "prevue", "faite"];
const FORME_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const LONGUEUR_MAX_REPONSE = 1000;
const introuvable = { ok: false, erreur: "introuvable" } as const;
const prevenir = (auteurId: number | null, type: NouvelleNotificationCloche["type"], id: number, titre: string): NouvelleNotificationCloche[] =>
  auteurId === null ? [] : [{ compteId: auteurId, type, acteurId: null, cible: { type: "idee", id: String(id) }, detail: titre }];

export async function listerIdeesGestion(o: { statut?: StatutIdee; nombre?: number } = {}, base = baseDeDonnees): Promise<IdeeGestion[]> {
  const lignes = await base.ideeCommunaute.findMany({
    where: o.statut ? { statut: o.statut } : {},
    select: {
      id: true, titre: true, detail: true, statut: true, reponseBrigade: true, reponduLe: true, ideeDuMois: true, suspendueLe: true, retireeLe: true, publieeLe: true, creeLe: true,
      auteur: { select: { pseudo: true, prenom: true } }, _count: { select: { votes: true, commentaires: true } },
    },
    orderBy: [{ creeLe: "desc" }, { id: "desc" }],
    take: Math.min(o.nombre ?? 200, 500),
  });
  return lignes.map(({ _count, suspendueLe, retireeLe, statut, ...l }) => ({
    ...l, statut: statut as StatutIdee, votes: _count.votes, commentaires: _count.commentaires, suspendue: suspendueLe !== null, retiree: retireeLe !== null,
  }));
}

export async function changerStatutIdee(id: number, statut: StatutIdee, maintenant: Date, base = baseDeDonnees): Promise<ResultatGestionCommunaute> {
  if (!STATUTS.includes(statut)) return { ok: false, erreur: "champ-invalide" };
  const idee = await base.ideeCommunaute.findUnique({ where: { id }, select: { auteurId: true, titre: true, statut: true, publieeLe: true } });
  if (!idee) return introuvable;
  const publiee = idee.statut === "en-relecture" && statut !== "en-relecture";
  await base.ideeCommunaute.update({ where: { id }, data: { statut, modifieLe: maintenant, ...(publiee && !idee.publieeLe ? { publieeLe: maintenant } : {}) } });
  return { ok: true, notifications: publiee ? prevenir(idee.auteurId, "idee-publiee", id, idee.titre) : [] };
}

export async function repondreIdee(id: number, texte: string | null, maintenant: Date, base = baseDeDonnees): Promise<ResultatGestionCommunaute> {
  const propre = texte?.trim() ?? "";
  if ([...propre].length > LONGUEUR_MAX_REPONSE) return { ok: false, erreur: "champ-invalide" };
  const idee = await base.ideeCommunaute.findUnique({ where: { id }, select: { auteurId: true, titre: true } });
  if (!idee) return introuvable;
  await base.ideeCommunaute.update({ where: { id }, data: propre ? { reponseBrigade: propre, reponduLe: maintenant, modifieLe: maintenant } : { reponseBrigade: null, reponduLe: null, modifieLe: maintenant } });
  return { ok: true, notifications: propre ? prevenir(idee.auteurId, "reponse-brigade", id, idee.titre) : [] };
}

export async function choisirIdeeDuMois(id: number, mois: string, maintenant: Date, base = baseDeDonnees): Promise<ResultatGestionCommunaute> {
  if (!FORME_MOIS.test(mois)) return { ok: false, erreur: "champ-invalide" };
  return base.$transaction(async (tx) => {
    const idee = await tx.ideeCommunaute.findUnique({ where: { id }, select: { auteurId: true, titre: true } });
    if (!idee) return introuvable;
    await tx.ideeCommunaute.updateMany({ where: { ideeDuMois: mois, id: { not: id } }, data: { ideeDuMois: null } });
    await tx.ideeCommunaute.update({ where: { id }, data: { ideeDuMois: mois, modifieLe: maintenant } });
    return { ok: true as const, notifications: prevenir(idee.auteurId, "idee-du-mois", id, idee.titre) };
  });
}

export async function supprimerIdee(id: number, base = baseDeDonnees): Promise<ResultatGestionCommunaute> {
  const { count } = await base.ideeCommunaute.deleteMany({ where: { id } });
  return count > 0 ? { ok: true, notifications: [] } : introuvable;
}

export async function masquerCommentaireIdee(id: number, masque: boolean, maintenant: Date, base = baseDeDonnees): Promise<ResultatGestionCommunaute> {
  const { count } = await base.commentaireIdeeCommunaute.updateMany({ where: { id }, data: { masqueLe: masque ? maintenant : null } });
  return count > 0 ? { ok: true, notifications: [] } : introuvable;
}

export async function listerEtiquettesLibres(o: { nombre?: number; avecRetirees?: boolean } = {}, base = baseDeDonnees) {
  const lignes = await base.etiquetteSortieDesMiamis.findMany({
    where: { officielle: false, ...(o.avecRetirees ? {} : { retireeLe: null }) },
    select: { sortieId: true, nom: true, retireeLe: true, sortie: { select: { titre: true, organisateurId: true, quand: true, creeLe: true } } },
    orderBy: [{ sortie: { creeLe: "desc" } }, { nom: "asc" }],
    take: Math.min(o.nombre ?? 300, 1000),
  });
  return lignes.map((l) => ({ sortieId: l.sortieId, nom: l.nom, retireeLe: l.retireeLe, titreSortie: l.sortie.titre, organisateurId: l.sortie.organisateurId, quand: l.sortie.quand }));
}

export async function retirerEtiquetteLibre(sortieId: number, nom: string, maintenant: Date, base = baseDeDonnees): Promise<ResultatGestionCommunaute> {
  const { count } = await base.etiquetteSortieDesMiamis.updateMany({ where: { sortieId, nom, officielle: false, retireeLe: null }, data: { retireeLe: maintenant } });
  if (count === 0) return introuvable;
  await base.sortieDesMiamis.update({ where: { id: sortieId }, data: { version: { increment: 1 }, modifieLe: maintenant }, select: { id: true } });
  return { ok: true, notifications: [] };
}

export async function retirerSortieMiamis(id: number, maintenant: Date, medias: StockageMediasChat = creerStockageMediasChat(), base = baseDeDonnees): Promise<ResultatGestionCommunaute> {
  const issue = await base.$transaction((tx) => retirerSortieMiamisDans(tx, id, maintenant, medias));
  await issue.apresTransaction();
  return { ok: true, notifications: issue.notifications };
}
