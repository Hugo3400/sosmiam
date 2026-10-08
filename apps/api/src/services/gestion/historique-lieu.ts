// Tout ce qui concerne un lieu, sur sa fiche du logiciel : ses publications, les signalements reçus, ses BIG SOS, les
// missions d'ambassadeurs qui le visent et la demande d'où il vient.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerPhaseBigSos } from "../../fonctions/big-sos/calculer-phase-big-sos.ts";

export async function lireHistoriqueLieu(id: number, maintenant = new Date()) {
  const [publications, signalements, bigSos, missions, demandes] = await Promise.all([
    baseDeDonnees.publication.findMany({
      where: { lieuId: id }, orderBy: { creeLe: "desc" }, take: 20,
      select: { id: true, legende: true, statut: true, suspendue: true, publieeLe: true, auteurType: true, auteurPseudo: true },
    }),
    baseDeDonnees.signalement.findMany({
      where: { lieuId: id }, orderBy: { creeLe: "desc" }, take: 20,
      select: { id: true, cibleId: true, raison: true, statut: true, creeLe: true },
    }),
    baseDeDonnees.bigSos.findMany({
      where: { lieuId: id }, orderBy: { creeLe: "desc" },
      select: { id: true, statut: true, debutLe: true, finLe: true, creeLe: true, objectifTitre: true, objectifCible: true, objectifAtteint: true },
    }),
    baseDeDonnees.missionAmbassadeur.findMany({
      where: { lieuId: id }, orderBy: { creeLe: "desc" }, take: 20,
      select: { id: true, titre: true, statut: true, faiteLe: true, compteRendu: true, creeLe: true, compte: { select: { id: true, prenom: true } } },
    }),
    baseDeDonnees.demandeLieu.findMany({
      where: { lieuId: id }, orderBy: { creeLe: "desc" },
      select: { id: true, origine: true, creeLe: true, statut: true },
    }),
  ]);
  return {
    publications: publications.map((p) => ({ ...p, legende: p.legende.slice(0, 100) })),
    signalements,
    bigSos: bigSos.map((b) => ({ ...b, phase: calculerPhaseBigSos(b, maintenant) })),
    missions,
    demandes,
  };
}
