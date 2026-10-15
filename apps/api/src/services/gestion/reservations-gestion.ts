// Les réservations vues par l'équipe : le bilan de chaque lieu sur une période (demandées, en attente, refusées, sans
// réponse, absences), pour repérer les lieux qui ne répondent jamais. Des nombres seulement, jamais un client.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { normaliserNomCommune } from "../../fonctions/geo/normaliser-nom-commune.ts";
import { repondPas, resumerReservationsLieux } from "../../fonctions/reservations/resumer-reservations-lieux.ts";

const LIEUX_MAX = 300;

export async function lireReservationsGestion({ jours, ville }: { jours: number; ville: string }, maintenant = new Date()) {
  const lignes = await baseDeDonnees.reservation.findMany({
    where: { creeLe: { gte: new Date(maintenant.getTime() - jours * 86_400_000) } },
    select: { lieuId: true, statut: true, motifRefus: true, tardive: true, creeLe: true, reponduLe: true, creneau: true },
  });
  const cle = normaliserNomCommune(ville);
  const lieux = await baseDeDonnees.lieu.findMany({
    where: { id: { in: [...new Set(lignes.map((l) => l.lieuId))] } },
    select: { id: true, nom: true, ville: true, statut: true },
  });
  const gardes = new Map(lieux.filter((l) => !cle || normaliserNomCommune(l.ville) === cle).map((l) => [l.id, l]));
  const { parLieu, tout } = resumerReservationsLieux(lignes.filter((l) => gardes.has(l.lieuId)), maintenant);
  const resultats = [...parLieu].map(([id, bilan]) => ({ lieu: gardes.get(id)!, ...bilan, repondPas: repondPas(bilan) }));
  resultats.sort((a, b) => Number(b.repondPas) - Number(a.repondPas) || b.sansReponse - a.sansReponse || b.demandes - a.demandes);
  return { jours, totaux: { ...tout, lieux: resultats.length, lieuxQuiRepondentPas: resultats.filter((r) => r.repondPas).length }, lieux: resultats.slice(0, LIEUX_MAX) };
}
