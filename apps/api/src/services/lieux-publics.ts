import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

/** Ce que le public voit d'un lieu : jamais la note interne, le téléphone ni l'adresse exacte. */
export type LieuPublic = {
  id: number;
  nom: string;
  /** « resto », « patisserie », « bar » ou « sortie » */
  type: string;
  emoji: string;
  info: string;
  quartier: string;
  ville: string;
  prix: string;
  couleurs: string[];
  decouvertPar: string | null;
};

/** Les lieux publiés (statut « publie »), du plus récemment mis à jour au plus ancien, 48 au plus. */
export async function listerLieuxPublics(): Promise<LieuPublic[]> {
  return baseDeDonnees.lieu.findMany({
    where: { statut: "publie" },
    select: { id: true, nom: true, type: true, emoji: true, info: true, quartier: true, ville: true, prix: true, couleurs: true, decouvertPar: true },
    orderBy: { modifieLe: "desc" },
    take: 48,
  });
}
