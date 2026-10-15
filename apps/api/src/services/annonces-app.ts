import type { AnnonceApp } from "../../../../packages/commun/src/types/annonce-app.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

const ANNONCES_MAX = 10;

export async function listerAnnoncesApp({ ville, compteId }: { ville: string; compteId: number | null }, maintenant = new Date()): Promise<AnnonceApp[]> {
  const [pro, ambassadeur] = compteId
    ? await Promise.all([
      baseDeDonnees.rattachementLieu.count({ where: { compteId, statut: "valide" } }),
      baseDeDonnees.ambassadeur.count({ where: { compteId, statut: "actif" } }),
    ])
    : [0, 0];
  const cibles = [
    { cible: "tous" },
    ...(ville ? [{ cible: "ville", ville: { equals: ville, mode: "insensitive" as const } }] : []),
    ...(pro > 0 ? [{ cible: "pros" }] : []),
    ...(ambassadeur > 0 ? [{ cible: "ambassadeurs" }] : []),
  ];
  const lignes = await baseDeDonnees.annonceApp.findMany({
    where: { publieeLe: { not: null }, retireeLe: null, debut: { lte: maintenant }, AND: [{ OR: [{ fin: null }, { fin: { gt: maintenant } }] }, { OR: cibles }] },
    orderBy: [{ debut: "desc" }, { id: "desc" }],
    take: ANNONCES_MAX,
  });
  return lignes.map((a) => ({
    id: a.id,
    titre: a.titre,
    texte: a.texte,
    emoji: a.emoji,
    bouton: a.boutonLibelle && a.boutonLien ? { libelle: a.boutonLibelle, lien: a.boutonLien } : null,
    fin: a.fin?.toISOString() ?? null,
  }));
}
