// Les BIG SOS en cours, pour le site et l'app (lecture seule, sans rien de privé : ni note de l'équipe, ni compte).
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

/** Les BIG SOS à la une en ce moment (validés, entre leur début et leur fin), avec leur lieu publié. */
export async function listerBigSosEnCours(maintenant = new Date()) {
  return baseDeDonnees.bigSos.findMany({
    where: { statut: "valide", debutLe: { lte: maintenant }, finLe: { gt: maintenant }, lieu: { statut: "publie" } },
    orderBy: { debutLe: "asc" },
    select: {
      id: true, histoire: true, objectifTitre: true, objectifCible: true, objectifAtteint: true, liens: true, debutLe: true, finLe: true,
      lieu: { select: { id: true, nom: true, emoji: true, ville: true, quartier: true } },
    },
  });
}
