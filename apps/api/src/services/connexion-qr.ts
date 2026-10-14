// Connexion par QR code dans la base (table demandes_connexion_qr) : seulement les empreintes SHA-256 du code et du secret.
// Chaque écriture est un updateMany conditionné par l'état attendu : deux appels simultanés ne passent jamais tous les deux.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { GARDE_APRES_EXPIRATION_QR, type CibleQr, type DemandeQr, type OrigineQr, type ServicesConnexionQr, type StatutQr } from "./connexion-qr-regles.ts";

const CHAMPS = {
  id: true, cible: true, origine: true, appareil: true, statut: true, compteId: true, creeLe: true, expireLe: true, scanneLe: true, reponduLe: true,
} as const;

type Ligne = {
  id: number; cible: string; origine: string; appareil: string; statut: string; compteId: number | null;
  creeLe: Date; expireLe: Date; scanneLe: Date | null; reponduLe: Date | null;
};

const presenter = (ligne: Ligne | null): DemandeQr | null => ligne && {
  ...ligne,
  cible: ligne.cible as CibleQr, origine: ligne.origine as OrigineQr, statut: ligne.statut as StatutQr,
  creeLe: ligne.creeLe.getTime(), expireLe: ligne.expireLe.getTime(), scanneLe: ligne.scanneLe?.getTime() ?? null, reponduLe: ligne.reponduLe?.getTime() ?? null,
};

export const servicesConnexionQr: ServicesConnexionQr = {
  async creer({ codeEmpreinte, secretEmpreinte, cible, origine, appareil, creeLe, expireLe }) {
    await baseDeDonnees.demandeConnexionQr.create({
      data: { codeEmpreinte, secretEmpreinte, cible, origine, appareil, creeLe: new Date(creeLe), expireLe: new Date(expireLe) },
    });
  },
  lireParCode: async (codeEmpreinte) => presenter(await baseDeDonnees.demandeConnexionQr.findUnique({ where: { codeEmpreinte }, select: CHAMPS })),
  lireParSecret: async (secretEmpreinte) => presenter(await baseDeDonnees.demandeConnexionQr.findUnique({ where: { secretEmpreinte }, select: CHAMPS })),
  async noterScan(id, compteId, maintenant) {
    const { count } = await baseDeDonnees.demandeConnexionQr.updateMany({
      where: { id, statut: "attente" }, data: { statut: "scanne", compteId, scanneLe: new Date(maintenant) },
    });
    return count === 1;
  },
  async repondre(id, compteId, accepte, maintenant) {
    const { count } = await baseDeDonnees.demandeConnexionQr.updateMany({
      where: { id, statut: "scanne", compteId }, data: { statut: accepte ? "accepte" : "refuse", reponduLe: new Date(maintenant) },
    });
    return count === 1;
  },
  async utiliser(id) {
    const { count } = await baseDeDonnees.demandeConnexionQr.updateMany({ where: { id, statut: "accepte" }, data: { statut: "utilisee" } });
    return count === 1;
  },
};

/** Ménage de nuit (taches/taches-de-nuit.ts) : les demandes expirées depuis plus d'un jour ; seul leur nombre est rendu. */
export async function effacerDemandesQrExpirees(maintenant = new Date()): Promise<number> {
  const { count } = await baseDeDonnees.demandeConnexionQr.deleteMany({
    where: { expireLe: { lt: new Date(maintenant.getTime() - GARDE_APRES_EXPIRATION_QR) } },
  });
  return count;
}
