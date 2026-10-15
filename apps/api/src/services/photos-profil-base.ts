import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { construireFiltreLimitationActive } from "../fonctions/comptes/construire-filtre-limitation-active.ts";
import { signalementsGardantLeurFichier } from "./effacer-conversations.ts";
import { creerPhotosProfil } from "./photos-profil.ts";
import type { DepotPhotosProfil, PhotoDuCompte, TransactionPhotosProfil } from "./photos-profil-regles.ts";
import { creerStockagePhotosProfil } from "./stockage-photos-profil.ts";

type BasePhotosProfil = Pick<typeof baseDeDonnees, "$transaction" | "compte" | "blocage" | "signalement">;

function creerTransactionPhotosProfil(tx: Prisma.TransactionClient): TransactionPhotosProfil {
  return {
    async verrouillerCompte(compteId) {
      const [ligne] = await tx.$queryRaw<PhotoDuCompte[]>`SELECT photo_profil AS photo, avatar FROM comptes WHERE id = ${compteId} FOR NO KEY UPDATE`;
      return ligne ?? null;
    },
    async ecrirePhoto(compteId, photo) {
      await tx.compte.update({ where: { id: compteId }, data: { photoProfil: photo } });
    },
    async listerSignalementsAGarder(compteId, depuis, seuil) {
      const lignes = await tx.signalement.findMany({
        where: { AND: [{ cible: "profil", auteurContenuId: compteId, fichierMedia: null, creeLe: { gte: depuis } }, signalementsGardantLeurFichier(seuil)] },
        select: { id: true },
      });
      return lignes.map((l) => l.id);
    },
    async citerPreuve(signalementIds, fichier) {
      if (signalementIds.length === 0) return 0;
      const { count } = await tx.signalement.updateMany({ where: { id: { in: [...signalementIds] }, fichierMedia: null }, data: { fichierMedia: fichier } });
      return count;
    },
  };
}

export function creerDepotPhotosProfil(base: BasePhotosProfil = baseDeDonnees): DepotPhotosProfil {
  return {
    ecrire: (faire) => base.$transaction((tx) => faire(creerTransactionPhotosProfil(tx))),

    async lireTitulaire(photo, maintenant) {
      const compte = await base.compte.findUnique({
        where: { photoProfil: photo },
        select: { id: true, limitations: { where: construireFiltreLimitationActive(maintenant), select: { id: true }, take: 1 } },
      });
      return compte ? { compteId: compte.id, limite: compte.limitations.length > 0 } : null;
    },

    async bloqueEntre(a, b) {
      return (await base.blocage.count({ where: { OR: [{ bloqueurId: a, bloqueId: b }, { bloqueurId: b, bloqueId: a }] } })) > 0;
    },

    async listerPhotosCitees(photos) {
      if (photos.length === 0) return new Set();
      const comptes = await base.compte.findMany({ where: { photoProfil: { in: [...photos] } }, select: { photoProfil: true } });
      return new Set(comptes.flatMap((c) => (c.photoProfil ? [c.photoProfil] : [])));
    },

    async lirePhoto(compteId) {
      return (await base.compte.findUnique({ where: { id: compteId }, select: { photoProfil: true } }))?.photoProfil ?? null;
    },

    async lireSignalementDeProfil(signalementId) {
      if (!Number.isSafeInteger(signalementId) || signalementId < 1) return null;
      return base.signalement.findFirst({ where: { id: signalementId, cible: "profil" }, select: { auteurContenuId: true, fichierMedia: true, creeLe: true } });
    },
  };
}

export async function menagerPhotosProfil(maintenant = new Date()): Promise<number> {
  return creerPhotosProfil({ stockage: creerStockagePhotosProfil(), depot: creerDepotPhotosProfil(), preuves: null }).menager(maintenant);
}
