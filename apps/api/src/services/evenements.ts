// Événements des lieux dans la base. La création passe par une transaction sous verrou de la ligne du lieu : deux membres
// de l'équipe qui publient en même temps ne dépassent jamais les 10 événements à venir.
import type { TarifEvenement, TypeEvenement } from "../../../../packages/commun/src/types/evenement.ts";
import type { TypeLieu } from "../../../../packages/commun/src/types/lieu.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { compterEvenementsAVenir } from "../fonctions/evenements/compter-evenements-a-venir.ts";
import {
  calculerBornePeutFinir, EVENEMENTS_EQUIPE_LUS_MAX, EVENEMENTS_LUS_MAX, INTERETS_LUS_MAX, type EvenementAvecLieu, type LieuEvenement,
  type LigneEvenement, type ServicesEvenements,
} from "./evenements-regles.ts";

const CHAMPS = {
  id: true, lieuId: true, compteId: true, titre: true, type: true, description: true, debut: true, fin: true, hebdoJusqua: true,
  tarif: true, prixCentimes: true, places: true, photo: true, alcool: true, creeLe: true, modifieLe: true, annuleLe: true, suspendu: true,
} as const;
const CHAMPS_LIEU = { id: true, nom: true, emoji: true, type: true, ville: true, statut: true } as const;
const CHAMPS_EQUIPE = { ...CHAMPS, compte: { select: { prenom: true } }, _count: { select: { interets: true } } } as const;

type LigneLue = Omit<LigneEvenement, "type" | "tarif"> & { type: string; tarif: string };
type LieuLu = { id: number; nom: string; emoji: string; type: string; ville: string; statut: string };

/** Le type et le tarif sont écrits par l'API seulement (validerEvenement) : relus tels quels */
const versLigne = (l: LigneLue): LigneEvenement => ({ ...l, type: l.type as TypeEvenement, tarif: l.tarif as TarifEvenement });
const versLieu = ({ statut, type, ...l }: LieuLu): LieuEvenement => ({ ...l, type: type as TypeLieu, publie: statut === "publie" });
const versEquipe = ({ compte, _count, ...l }: LigneLue & { compte: { prenom: string } | null; _count: { interets: number } }) => ({
  ...versLigne(l), publiePar: compte?.prenom ?? null, interesses: _count.interets,
});
const versAvecLieu = ({ lieu, ...l }: LigneLue & { lieu: LieuLu }): EvenementAvecLieu => ({ ...versLigne(l), lieu: versLieu(lieu) });

/** Les événements dont la dernière date peut encore finir après `depuis` (evenements-regles.ts) */
const peutFinirApres = (depuis: Date) => {
  const borne = calculerBornePeutFinir(depuis);
  return { OR: [{ hebdoJusqua: { gte: borne } }, { hebdoJusqua: null, debut: { gte: borne } }] };
};

export function creerEvenements(): ServicesEvenements {
  return {
    async lireLieu(lieuId) {
      const lieu = await baseDeDonnees.lieu.findUnique({ where: { id: lieuId }, select: CHAMPS_LIEU });
      return lieu ? versLieu(lieu) : null;
    },

    async listerPourEquipe(lieuId, depuis) {
      const lignes = await baseDeDonnees.evenementLieu.findMany({
        where: { lieuId, ...peutFinirApres(depuis) },
        select: CHAMPS_EQUIPE,
        orderBy: [{ debut: "asc" }, { id: "asc" }],
        take: EVENEMENTS_EQUIPE_LUS_MAX,
      });
      return lignes.map(versEquipe);
    },

    async lirePourEquipe(evenementId) {
      const ligne = await baseDeDonnees.evenementLieu.findUnique({ where: { id: evenementId }, select: CHAMPS_EQUIPE });
      return ligne ? versEquipe(ligne) : null;
    },

    async creer(lieuId, compteId, champs, maintenant, maximum) {
      return baseDeDonnees.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM lieux WHERE id = ${lieuId} FOR UPDATE`;
        const existants = await transaction.evenementLieu.findMany({
          where: { lieuId, annuleLe: null, ...peutFinirApres(maintenant) },
          select: { debut: true, fin: true, hebdoJusqua: true, annuleLe: true },
        });
        if (compterEvenementsAVenir(existants, maintenant) >= maximum) return { ok: false as const, erreur: "trop-d-evenements" as const };
        const cree = await transaction.evenementLieu.create({ data: { lieuId, compteId, ...champs, creeLe: maintenant, modifieLe: maintenant }, select: { id: true } });
        return { ok: true as const, id: cree.id };
      });
    },

    async modifier(evenementId, champs) {
      await baseDeDonnees.evenementLieu.update({ where: { id: evenementId }, data: champs });
    },

    async annuler(evenementId, maintenant) {
      await baseDeDonnees.evenementLieu.updateMany({ where: { id: evenementId, annuleLe: null }, data: { annuleLe: maintenant } });
    },

    async listerVisibles({ zone, lieuId, du, au }) {
      const lignes = await baseDeDonnees.evenementLieu.findMany({
        where: {
          suspendu: false,
          annuleLe: null,
          debut: { lt: au },
          ...peutFinirApres(du),
          ...(lieuId === null ? {} : { lieuId }),
          lieu: {
            statut: "publie",
            ...(zone ? { latitude: { gte: zone.sud, lte: zone.nord }, longitude: { gte: zone.ouest, lte: zone.est } } : {}),
          },
        },
        select: { ...CHAMPS, lieu: { select: CHAMPS_LIEU } },
        orderBy: [{ debut: "asc" }, { id: "asc" }],
        take: EVENEMENTS_LUS_MAX,
      });
      return lignes.map(versAvecLieu);
    },

    async lireAvecLieu(evenementId) {
      const ligne = await baseDeDonnees.evenementLieu.findUnique({ where: { id: evenementId }, select: { ...CHAMPS, lieu: { select: CHAMPS_LIEU } } });
      return ligne ? versAvecLieu(ligne) : null;
    },

    async listerInterets(compteId, depuis) {
      const interets = await baseDeDonnees.interetEvenement.findMany({
        where: { compteId, evenement: peutFinirApres(depuis) },
        select: { rappel: true, evenement: { select: { ...CHAMPS, lieu: { select: CHAMPS_LIEU } } } },
        orderBy: { creeLe: "desc" },
        take: INTERETS_LUS_MAX,
      });
      return interets.map((i) => ({ rappel: i.rappel, evenement: versAvecLieu(i.evenement) }));
    },

    async poserInteret(compteId, evenementId, rappel) {
      await baseDeDonnees.interetEvenement.upsert({
        where: { compteId_evenementId: { compteId, evenementId } },
        create: { compteId, evenementId, rappel },
        update: { rappel },
      });
    },

    async retirerInteret(compteId, evenementId) {
      await baseDeDonnees.interetEvenement.deleteMany({ where: { compteId, evenementId } });
    },

    async lireNaissanceChiffree(compteId) {
      const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { dateNaissanceChiffree: true } });
      return compte ? compte.dateNaissanceChiffree : undefined;
    },
  };
}
