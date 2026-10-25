import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { SIGNALEMENT_OUVERT } from "./effacer-conversations.ts";
import { creerImagesLieu } from "./images-lieu.ts";
import type { DepotSignalementsImagesLieu } from "./images-lieu-signalements.ts";
import type { DepotImagesLieu, ImagesDuLieu, TransactionImagesLieu } from "./images-lieu-regles.ts";
import { servicesPro } from "./pro.ts";
import { creerStockagesImagesLieu } from "./stockage-images-lieu.ts";

type BaseImagesLieu = Pick<typeof baseDeDonnees, "$transaction" | "lieu">;

function creerTransactionImagesLieu(tx: Prisma.TransactionClient): TransactionImagesLieu {
  return {
    async verrouillerLieu(lieuId) {
      const [ligne] = await tx.$queryRaw<ImagesDuLieu[]>`SELECT banniere, logo FROM lieux WHERE id = ${lieuId} FOR NO KEY UPDATE`;
      return ligne ?? null;
    },
    async ecrireImage(lieuId, quelle, nom, quand) {
      const data = quelle === "banniere" ? { banniere: nom, imagesMajLe: quand } : { logo: nom, imagesMajLe: quand };
      await tx.lieu.update({ where: { id: lieuId }, data });
    },
  };
}

export function creerDepotImagesLieu(base: BaseImagesLieu = baseDeDonnees): DepotImagesLieu {
  return {
    ecrire: (faire) => base.$transaction((tx) => faire(creerTransactionImagesLieu(tx))),

    async lireLieuDeLImage(nom) {
      const lieu = await base.lieu.findFirst({ where: { OR: [{ banniere: nom }, { logo: nom }] }, select: { id: true, statut: true } });
      return lieu ? { lieuId: lieu.id, publie: lieu.statut === "publie" } : null;
    },

    async listerImagesCitees(noms) {
      if (noms.length === 0) return new Set();
      const liste = [...noms];
      const lieux = await base.lieu.findMany({ where: { OR: [{ banniere: { in: liste } }, { logo: { in: liste } }] }, select: { banniere: true, logo: true } });
      return new Set(lieux.flatMap((l) => [l.banniere, l.logo].filter((nom): nom is string => nom !== null && liste.includes(nom))));
    },
  };
}

export function creerImagesLieuEnLigne() {
  return creerImagesLieu({ stockages: creerStockagesImagesLieu(), depot: creerDepotImagesLieu(), lireRole: (compteId, lieuId) => servicesPro.lireRole(compteId, lieuId) });
}

export async function menagerImagesLieu(maintenant = new Date()): Promise<number> {
  return creerImagesLieuEnLigne().menager(maintenant);
}

type BaseSignalementsImagesLieu = Pick<typeof baseDeDonnees, "$transaction" | "lieu" | "signalement" | "compte">;

export function creerDepotSignalementsImagesLieu(base: BaseSignalementsImagesLieu = baseDeDonnees): DepotSignalementsImagesLieu {
  return {
    async lireImagePubliee(lieuId, quelle) {
      const lieu = await base.lieu.findUnique({ where: { id: lieuId }, select: { statut: true, banniere: true, logo: true } });
      return lieu?.statut === "publie" ? lieu[quelle] : null;
    },
    async estDejaSignalee(cibleId, signaleParId) {
      return (await base.signalement.count({ where: { cible: "image-lieu", cibleId, signaleParId, statut: "a-traiter" } })) > 0;
    },
    async aUnePreuveOuverte(cibleId) {
      return (await base.signalement.count({ where: { AND: [{ cible: "image-lieu", cibleId, fichierMedia: { not: null } }, SIGNALEMENT_OUVERT] } })) > 0;
    },
    async compteExiste(compteId) {
      return (await base.compte.count({ where: { id: compteId } })) > 0;
    },
    ecrire: (s, instantane) => base.$transaction(async (tx) => {
      const { id } = await tx.signalement.create({ data: { cible: "image-lieu", ...s }, select: { id: true } });
      await tx.signalement.update({ where: { id }, data: { instantaneChiffre: instantane(id) } });
      return id;
    }),
  };
}
