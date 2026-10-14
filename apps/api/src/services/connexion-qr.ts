// Connexion par QR code dans la base (table demandes_connexion_qr) : seulement les empreintes SHA-256 du code et du secret.
// Chaque écriture est un updateMany conditionné par l'état attendu : deux appels simultanés ne passent jamais tous les deux ;
// la remise de la session (et sa relance) se fait dans une transaction, sous verrou de la demande.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { choisirRemiseQr } from "../fonctions/comptes/choisir-remise-qr.ts";
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
      select: { id: true },
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
  async remettre(id, empreinteSession, maintenant) {
    try {
      return await remettreAvecRelance(id, empreinteSession, maintenant);
    } catch (erreur) {
      // Base pas encore migrée (colonnes session_id, remis_le, nombre_remises absentes) : une seule remise, comme avant
      if (!estColonneAbsente(erreur)) throw erreur;
      return remettreUneFois(id, empreinteSession, maintenant);
    }
  },
};

const nouvelleSession = (empreinte: string, compteId: number, cible: string, maintenant: number) => ({
  empreinte, compteId, support: cible === "app" ? "app" : "site", creeLe: new Date(maintenant), activite: new Date(maintenant),
});

/** La demande verrouillée (FOR UPDATE, sur les seules colonnes d'origine) : une remise à la fois, la suivante relit après */
function remettreAvecRelance(id: number, empreinteSession: string, maintenant: number): Promise<boolean> {
  return baseDeDonnees.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM demandes_connexion_qr WHERE id = ${id} FOR UPDATE`;
    const demande = await transaction.demandeConnexionQr.findUnique({
      where: { id }, select: { statut: true, compteId: true, cible: true, sessionId: true, remisLe: true, nombreRemises: true },
    });
    if (!demande || demande.compteId === null) return false;
    const remise = choisirRemiseQr({ statut: demande.statut as StatutQr, remisLe: demande.remisLe?.getTime() ?? null, nombreRemises: demande.nombreRemises }, maintenant);
    if (!remise) return false;
    // La session remise avant (relance) est révoquée ; fermée entre-temps, il n'y a rien à faire
    if (demande.sessionId !== null) await transaction.sessionCompte.deleteMany({ where: { id: demande.sessionId } });
    const session = await transaction.sessionCompte.create({
      data: nouvelleSession(empreinteSession, demande.compteId, demande.cible, maintenant), select: { id: true },
    });
    await transaction.demandeConnexionQr.update({
      where: { id },
      data: {
        statut: "utilisee", sessionId: session.id,
        remisLe: remise === "premiere" ? new Date(maintenant) : demande.remisLe, nombreRemises: (demande.nombreRemises ?? 0) + 1,
      },
      select: { id: true },
    });
    return true;
  });
}

/** Sans les colonnes de relance : « accepte » → « utilisee » (atomique), puis la session */
async function remettreUneFois(id: number, empreinteSession: string, maintenant: number): Promise<boolean> {
  const demande = await baseDeDonnees.demandeConnexionQr.findUnique({ where: { id }, select: { compteId: true, cible: true } });
  if (!demande || demande.compteId === null) return false;
  const { count } = await baseDeDonnees.demandeConnexionQr.updateMany({ where: { id, statut: "accepte" }, data: { statut: "utilisee" } });
  if (count !== 1) return false;
  await baseDeDonnees.sessionCompte.create({ data: nouvelleSession(empreinteSession, demande.compteId, demande.cible, maintenant), select: { id: true } });
  return true;
}

/** Colonne inconnue de la base (Prisma P2022, PostgreSQL 42703) */
function estColonneAbsente(erreur: unknown): boolean {
  if (typeof erreur !== "object" || erreur === null) return false;
  const { code, message, meta } = erreur as { code?: unknown; message?: unknown; meta?: unknown };
  if (code === "P2022") return true;
  return /42703|column .* does not exist/i.test(`${typeof message === "string" ? message : ""} ${JSON.stringify(meta ?? null)}`);
}

/** Ménage de nuit (taches/taches-de-nuit.ts) : les demandes expirées depuis plus d'un jour ; seul leur nombre est rendu. */
export async function effacerDemandesQrExpirees(maintenant = new Date()): Promise<number> {
  const { count } = await baseDeDonnees.demandeConnexionQr.deleteMany({
    where: { expireLe: { lt: new Date(maintenant.getTime() - GARDE_APRES_EXPIRATION_QR) } },
  });
  return count;
}
