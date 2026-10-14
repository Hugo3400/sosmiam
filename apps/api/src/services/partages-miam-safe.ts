// « Prévenir un pote » (Miam Safe) avec Prisma. La position est chiffrée avec une sous-clé de la clé des données
// (« miam-safe:position », contexte « partage:<id>:position » : un chiffré recopié sur une autre ligne ne se relit pas),
// effacée dès qu'un partage est fini, et jamais écrite dans un journal. Contrat : partages-miam-safe-regles.ts.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { chiffrerTexteVersionne } from "../fonctions/securite/chiffrer-texte-versionne.ts";
import { dechiffrerTexteVersionne } from "../fonctions/securite/dechiffrer-texte-versionne.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import {
  DUREE_PARTAGE_MS, type LignePartage, type PositionMiamSafe, type ServicesPartagesMiamSafe,
} from "./partages-miam-safe-regles.ts";

const CONTEXTE_CLE = "miam-safe:position";
const contexte = (id: number) => `partage:${id}:position`;

const CHAMPS = {
  id: true, compteId: true, poteId: true, avecPosition: true, positionChiffree: true, creeLe: true, expireLe: true, arreteLe: true,
  lieu: { select: { id: true, nom: true } },
} as const;

type LigneBase = {
  id: number; compteId: number; poteId: number; avecPosition: boolean; positionChiffree: string | null; creeLe: Date; expireLe: Date; arreteLe: Date | null;
  lieu: { id: number; nom: string } | null;
};

/** Un partage fini (arrêté, ou l'heure passée) */
const fini = (maintenant: Date) => ({ OR: [{ arreteLe: { not: null } }, { expireLe: { lte: maintenant } }] });

/** `chiffrement` : la clé des données (null : pas de clé, les partages se font sans position) */
export function creerPartagesMiamSafe(chiffrement: ChiffrementDonnees | null): ServicesPartagesMiamSafe {
  const chiffrer = (id: number, position: PositionMiamSafe, le: Date): string | null => {
    if (!chiffrement) return null;
    const cle = { version: chiffrement.versionCle, cle: chiffrement.deriverCle(CONTEXTE_CLE) };
    const clair = JSON.stringify({ lat: position.latitude, lng: position.longitude, precisionM: position.precisionM, le: le.toISOString() });
    return chiffrerTexteVersionne(clair, cle, contexte(id));
  };

  /** Illisible (clé changée, donnée retouchée) : pas de position, sans rien écrire au journal */
  const dechiffrer = (id: number, chiffre: string | null): LignePartage["position"] => {
    if (!chiffre || !chiffrement) return null;
    try {
      const lu = JSON.parse(dechiffrerTexteVersionne(chiffre, (v) => chiffrement.deriverCleVersion(CONTEXTE_CLE, v), contexte(id))) as Record<string, unknown>;
      const le = typeof lu.le === "string" ? new Date(lu.le) : null;
      if (typeof lu.lat !== "number" || typeof lu.lng !== "number" || !le || Number.isNaN(le.getTime())) return null;
      return { latitude: lu.lat, longitude: lu.lng, precisionM: typeof lu.precisionM === "number" ? lu.precisionM : null, le };
    } catch {
      return null;
    }
  };

  const versLigne = (l: LigneBase): LignePartage => ({
    id: l.id, compteId: l.compteId, poteId: l.poteId, lieu: l.lieu, avecPosition: l.avecPosition, position: dechiffrer(l.id, l.positionChiffree),
    creeLe: l.creeLe, expireLe: l.expireLe, arreteLe: l.arreteLe,
  });

  /** À chaque lecture : la position d'un partage fini s'efface tout de suite (pas besoin d'attendre la nuit) */
  const effacerPositionsFinies = (maintenant: Date) =>
    baseDeDonnees.partagePositionMiamSafe.updateMany({ where: { positionChiffree: { not: null }, ...fini(maintenant) }, data: { positionChiffree: null } });

  return {
    async creer({ compteId, poteId, lieuId, avecPosition, position }, maintenant) {
      const lieu = await baseDeDonnees.lieu.findFirst({ where: { id: lieuId, statut: "publie" }, select: { id: true } });
      if (!lieu) return { ok: false, erreur: "lieu-inconnu" };
      const ligne = await baseDeDonnees.$transaction(async (tx) => {
        await tx.partagePositionMiamSafe.updateMany({
          where: { compteId, poteId, arreteLe: null, expireLe: { gt: maintenant } },
          data: { arreteLe: maintenant, positionChiffree: null },
        });
        const { id } = await tx.partagePositionMiamSafe.create({
          data: { compteId, poteId, lieuId, avecPosition, creeLe: maintenant, expireLe: new Date(maintenant.getTime() + DUREE_PARTAGE_MS) },
          select: { id: true },
        });
        // Le contexte du chiffré contient l'id : la position s'écrit juste après la création
        const chiffre = avecPosition && position ? chiffrer(id, position, maintenant) : null;
        return tx.partagePositionMiamSafe.update({ where: { id }, data: { positionChiffree: chiffre }, select: CHAMPS });
      });
      await effacerPositionsFinies(maintenant);
      return { ok: true, partage: versLigne(ligne) };
    },

    async envoyerPosition(id, compteId, position, maintenant) {
      if (!chiffrement) return "indisponible";
      const chiffre = chiffrer(id, position, maintenant);
      const { count } = await baseDeDonnees.partagePositionMiamSafe.updateMany({
        where: { id, compteId, avecPosition: true, arreteLe: null, expireLe: { gt: maintenant } },
        data: { positionChiffree: chiffre },
      });
      if (count > 0) return "ok";
      const ligne = await baseDeDonnees.partagePositionMiamSafe.findFirst({ where: { id, compteId }, select: { avecPosition: true } });
      if (!ligne) return "inconnu";
      if (!ligne.avecPosition) return "sans-position";
      await effacerPositionsFinies(maintenant);
      return "termine";
    },

    async arreter(id, compteId, maintenant) {
      const ligne = await baseDeDonnees.partagePositionMiamSafe.findFirst({ where: { id, compteId }, select: { arreteLe: true } });
      if (!ligne) return false;
      await baseDeDonnees.partagePositionMiamSafe.update({
        where: { id },
        data: { arreteLe: ligne.arreteLe ?? maintenant, positionChiffree: null },
        select: { id: true },
      });
      return true;
    },

    async lire(id, maintenant) {
      await effacerPositionsFinies(maintenant);
      const ligne = await baseDeDonnees.partagePositionMiamSafe.findUnique({ where: { id }, select: CHAMPS });
      return ligne ? versLigne(ligne) : null;
    },

    async listerActifs(compteId, maintenant) {
      await effacerPositionsFinies(maintenant);
      const lignes = await baseDeDonnees.partagePositionMiamSafe.findMany({
        where: { OR: [{ compteId }, { poteId: compteId }], arreteLe: null, expireLe: { gt: maintenant } },
        orderBy: [{ creeLe: "desc" }, { id: "desc" }],
        take: 20,
        select: CHAMPS,
      });
      return lignes.map(versLigne);
    },
  };
}
