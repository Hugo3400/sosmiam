// Lecture des statistiques de visite pour le logiciel de gestion : totaux par période et classements du détail.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { listerPeriodes, type Echelle } from "../../fonctions/dates/lister-periodes.ts";
import type { DimensionMesure, SourceMesure } from "../mesure.ts";

const DIMENSIONS: DimensionMesure[] = ["page", "provenance", "appareil", "navigateur", "systeme", "pays"];
const TAILLE_CLASSEMENT = 20;

export async function lireStatistiques(source: SourceMesure, echelle: Echelle, nombre: number, maintenant = new Date()) {
  const periodes = listerPeriodes(echelle, nombre, maintenant);
  const premiere = periodes[0];
  const derniere = periodes[periodes.length - 1];
  if (!premiere || !derniere) return { echelle, periodes: [], details: {} };

  const [lignes, groupes] = await Promise.all([
    baseDeDonnees.statPeriode.findMany({
      where: { source, type: echelle, cle: { in: periodes.map((p) => p.cle) } },
      select: { cle: true, vues: true, visites: true, visiteurs: true },
    }),
    baseDeDonnees.statDetail.groupBy({
      by: ["dimension", "valeur"],
      where: { source, jour: { gte: premiere.debut, lte: derniere.fin } },
      _sum: { nombre: true },
    }),
  ]);
  const parCle = new Map(lignes.map((ligne) => [ligne.cle, ligne]));
  const details: Partial<Record<DimensionMesure, { valeur: string; nombre: number }[]>> = {};
  for (const dimension of DIMENSIONS) {
    details[dimension] = groupes
      .filter((groupe) => groupe.dimension === dimension)
      .map((groupe) => ({ valeur: groupe.valeur, nombre: groupe._sum.nombre ?? 0 }))
      .sort((a, b) => b.nombre - a.nombre)
      .slice(0, TAILLE_CLASSEMENT);
  }
  return {
    echelle,
    periodes: periodes.map((periode) => {
      const ligne = parCle.get(periode.cle);
      return { ...periode, vues: ligne?.vues ?? 0, visites: ligne?.visites ?? 0, visiteurs: ligne?.visiteurs ?? 0 };
    }),
    details,
  };
}
