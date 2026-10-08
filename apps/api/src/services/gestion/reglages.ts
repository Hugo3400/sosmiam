// Réglages du logiciel de gestion gardés sur le serveur (pour l'instant : l'objectif du mois).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";

export type ObjectifMois = { mesure: "visiteurs" | "vues" | "inscriptions"; valeur: number };

export async function lireObjectifMois(): Promise<ObjectifMois | null> {
  const reglage = await baseDeDonnees.reglageGestion.findUnique({ where: { cle: "objectif-mois" } });
  return (reglage?.valeur as ObjectifMois | undefined) ?? null;
}

/** Fixe (ou retire, avec null) l'objectif du mois. */
export async function ecrireObjectifMois(objectif: ObjectifMois | null): Promise<void> {
  if (!objectif) {
    await baseDeDonnees.reglageGestion.deleteMany({ where: { cle: "objectif-mois" } });
    return;
  }
  const valeur = objectif as unknown as Prisma.InputJsonValue;
  await baseDeDonnees.reglageGestion.upsert({ where: { cle: "objectif-mois" }, create: { cle: "objectif-mois", valeur }, update: { valeur } });
}
