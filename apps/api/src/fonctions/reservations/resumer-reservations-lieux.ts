// Le bilan des réservations de chaque lieu pour le logiciel de gestion : des NOMBRES seulement (jamais le client, son petit
// mot ni le code), pour repérer les lieux qui ne répondent pas. Une demande restée sans réponse jusqu'à 30 min avant le
// créneau compte « sans réponse », même si le passage qui l'écrit « expirée » n'a pas encore eu lieu.
import { EXPIRATION_AVANT_CRENEAU_MS } from "../../../../../packages/commun/src/regles/reservations.ts";

export type LigneReservation = { lieuId: number; statut: string; motifRefus: string | null; tardive: boolean; creeLe: Date; reponduLe: Date | null; creneau: Date };
export type BilanReservations = {
  demandes: number;
  enAttente: number;
  sansReponse: number;
  refusees: number;
  /** Acceptées, puis honorées, absentes ou en attente du créneau */
  acceptees: number;
  honorees: number;
  absents: number;
  /** Annulées par le client (dont tardives : moins de 2 h avant) */
  annulees: number;
  tardives: number;
  motifsRefus: Record<string, number>;
  /** Part des demandes qui ont eu une réponse, sur celles qui en attendaient une (null : rien à juger) */
  tauxReponse: number | null;
  /** Délai médian de réponse, en minutes (null : aucune réponse) */
  reponseMedianeMin: number | null;
};

/** Seuil « ne répond pas » : au moins 3 demandes sans réponse, et pas plus d'une sur deux traitée */
const SANS_REPONSE_MIN = 3;
const TAUX_REPONSE_FAIBLE = 0.5;

export const estSansReponse = (r: LigneReservation, maintenant: Date) =>
  r.statut === "expiree" || (r.statut === "demandee" && r.creneau.getTime() - EXPIRATION_AVANT_CRENEAU_MS <= maintenant.getTime());

export const repondPas = (b: BilanReservations) => b.sansReponse >= SANS_REPONSE_MIN && (b.tauxReponse ?? 1) <= TAUX_REPONSE_FAIBLE;

function bilanVide(): BilanReservations {
  return { demandes: 0, enAttente: 0, sansReponse: 0, refusees: 0, acceptees: 0, honorees: 0, absents: 0, annulees: 0, tardives: 0, motifsRefus: {}, tauxReponse: null, reponseMedianeMin: null };
}

function mediane(valeurs: number[]) {
  if (valeurs.length === 0) return null;
  const tri = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(tri.length / 2);
  return Math.round(tri.length % 2 ? tri[milieu]! : (tri[milieu - 1]! + tri[milieu]!) / 2);
}

/** Bilan par lieu (clé : lieuId) et bilan de l'ensemble, à partir des réservations d'une période. */
export function resumerReservationsLieux(lignes: LigneReservation[], maintenant: Date) {
  const parLieu = new Map<number, { bilan: BilanReservations; delais: number[]; aJuger: number }>();
  const tout = { bilan: bilanVide(), delais: [] as number[], aJuger: 0 };
  for (const r of lignes) {
    let lieu = parLieu.get(r.lieuId);
    if (!lieu) parLieu.set(r.lieuId, (lieu = { bilan: bilanVide(), delais: [], aJuger: 0 }));
    for (const cible of [lieu, tout]) {
      const b = cible.bilan;
      b.demandes++;
      const sansReponse = estSansReponse(r, maintenant);
      if (sansReponse) b.sansReponse++;
      else if (r.statut === "demandee") b.enAttente++;
      if (r.statut === "refusee") {
        b.refusees++;
        if (r.motifRefus) b.motifsRefus[r.motifRefus] = (b.motifsRefus[r.motifRefus] ?? 0) + 1;
      }
      if (["acceptee", "honoree", "absent"].includes(r.statut) || (r.statut === "annulee" && r.reponduLe)) b.acceptees++;
      if (r.statut === "honoree") b.honorees++;
      if (r.statut === "absent") b.absents++;
      if (r.statut === "annulee") {
        b.annulees++;
        if (r.tardive) b.tardives++;
      }
      if (r.reponduLe && r.statut !== "expiree") cible.delais.push((r.reponduLe.getTime() - r.creeLe.getTime()) / 60_000);
      // À juger : tout ce qui attendait une réponse et n'est ni en attente, ni annulé par le client avant qu'on réponde
      if (!(r.statut === "demandee" && !sansReponse) && !(r.statut === "annulee" && !r.reponduLe)) cible.aJuger++;
    }
  }
  const finir = (c: { bilan: BilanReservations; delais: number[]; aJuger: number }) => {
    const repondues = c.aJuger - c.bilan.sansReponse;
    return { ...c.bilan, tauxReponse: c.aJuger ? Math.round((repondues / c.aJuger) * 100) / 100 : null, reponseMedianeMin: mediane(c.delais) };
  };
  return { parLieu: new Map([...parLieu].map(([id, c]) => [id, finir(c)])), tout: finir(tout) };
}
