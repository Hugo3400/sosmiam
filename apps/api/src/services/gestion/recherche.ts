// Recherche partout (Ctrl+K dans le logiciel) : lieux, comptes, publications, BIG SOS, demandes de lieux et inscrits,
// par nom, adresse ou numéro. Quelques résultats par partie, de quoi ouvrir le bon écran directement.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

const PAR_PARTIE = 5;

export async function rechercherPartout(texte: string) {
  const q = texte.trim();
  if (q.length < 2) return { lieux: [], comptes: [], publications: [], bigSos: [], demandes: [], inscrits: [] };
  const contient = { contains: q, mode: "insensitive" as const };
  // « 12 » ou « n° 12 » : on cherche aussi par numéro
  const numero = Number(q.replace(/^n°\s*/i, ""));
  const parNumero = Number.isInteger(numero) && numero > 0 && numero < 2_147_483_647 ? numero : null;
  const [lieux, comptes, publications, bigSos, demandes, inscrits] = await Promise.all([
    baseDeDonnees.lieu.findMany({
      where: { OR: [{ nom: contient }, { ville: contient }, { quartier: contient }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { modifieLe: "desc" }, select: { id: true, nom: true, emoji: true, ville: true, statut: true },
    }),
    baseDeDonnees.compte.findMany({
      where: { OR: [{ prenom: contient }, { email: contient }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { derniereConnexion: "desc" }, select: { id: true, prenom: true, email: true, ambassadeur: { select: { statut: true } } },
    }),
    baseDeDonnees.publication.findMany({
      where: { OR: [{ legende: contient }, { auteurPseudo: contient }, { lieu: { nom: contient } }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, legende: true, statut: true, lieu: { select: { nom: true, emoji: true } } },
    }),
    baseDeDonnees.bigSos.findMany({
      where: { OR: [{ lieu: { nom: contient } }, { lieu: { ville: contient } }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, statut: true, lieu: { select: { nom: true, emoji: true, ville: true } } },
    }),
    baseDeDonnees.demandeLieu.findMany({
      where: { OR: [{ nom: contient }, { ville: contient }] },
      take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, nom: true, ville: true, statut: true },
    }),
    baseDeDonnees.inscriptionNewsletter.findMany({
      where: { email: contient }, take: PAR_PARTIE, orderBy: { derniereInscription: "desc" }, select: { id: true, email: true, ville: true },
    }),
  ]);
  return {
    lieux,
    comptes,
    publications: publications.map((p) => ({ ...p, legende: p.legende.slice(0, 80) })),
    bigSos,
    demandes,
    inscrits,
  };
}
