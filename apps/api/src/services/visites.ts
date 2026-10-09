// Les visites, la fidélité, le comptoir et les réservations dans la base : seulement lire et écrire (les règles sont dans
// visites-client.ts, fidelite-client.ts, comptoir.ts, reservations-client.ts et reservations-pro.ts). ecrire passe par une transaction ; les verrous portent sur la ligne du compte ou
// du lieu (SELECT … FOR UPDATE), et ne font rien en lecture.
import { EXPIRATION_AVANT_CRENEAU_MS, VENU_APRES_CRENEAU_MS } from "../../../../packages/commun/src/regles/reservations.ts";
import type { CreneauOuverture, TypeLieu } from "../../../../packages/commun/src/types/lieu.ts";
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { ResultatPosition } from "../../../../packages/commun/src/types/position.ts";
import type { MotifRefusReservation, StatutReservation } from "../../../../packages/commun/src/types/reservation.ts";
import type { ModeValidation, MotifRefusVisite, ReglementVisite, StatutVisite } from "../../../../packages/commun/src/types/visite.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { RoleRattachement } from "./pro-regles.ts";
import type { FiltreReservations, LigneReservation } from "./reservations-regles.ts";
import type { ChampsVisite, DepotVisites, LieuVisite, LigneCarte, LignePresentation, LigneVisite, TablesVisites } from "./visites-regles.ts";

type Client = Prisma.TransactionClient;
type VisiteBrute = Awaited<ReturnType<typeof baseDeDonnees.visite.findFirstOrThrow>>;
type PresentationBrute = Awaited<ReturnType<typeof baseDeDonnees.presentationQr.findFirstOrThrow>>;
type ReservationBrute = Awaited<ReturnType<typeof baseDeDonnees.reservation.findFirstOrThrow>>;

/** Un Json facultatif : null s'écrit DbNull */
const json = (valeur: unknown) => (valeur === null ? Prisma.DbNull : (valeur as Prisma.InputJsonValue));

const versVisite = (v: VisiteBrute): LigneVisite => ({
  ...v,
  mode: v.mode as ModeValidation,
  statut: v.statut as StatutVisite,
  resultatPosition: (v.resultatPosition ?? null) as ResultatPosition | null,
  motifRefus: v.motifRefus as MotifRefusVisite | null,
  reglement: (v.reglement ?? null) as ReglementVisite | null,
});

const versPresentation = (p: PresentationBrute): LignePresentation => ({ ...p, reglement: (p.reglement ?? null) as ReglementVisite | null });

const versReservation = (r: ReservationBrute): LigneReservation => ({
  ...r, statut: r.statut as StatutReservation, motifRefus: r.motifRefus as MotifRefusReservation | null,
});

/** Le filtre des réservations (créneau : depuis compris, avant exclu) */
const ouReservations = ({ compteId, lieuId, statuts, creneauDepuis, creneauAvant }: FiltreReservations) => ({
  compteId, lieuId,
  ...(statuts ? { statut: { in: statuts } } : {}),
  ...(creneauDepuis || creneauAvant ? { creneau: { ...(creneauDepuis ? { gte: creneauDepuis } : {}), ...(creneauAvant ? { lt: creneauAvant } : {}) } } : {}),
});

/** Les champs d'une visite à écrire (Json facultatifs compris) */
function versDonnees(champs: ChampsVisite) {
  const { resultatPosition, reglement, ...reste } = champs;
  return {
    ...reste,
    ...(resultatPosition !== undefined ? { resultatPosition: json(resultatPosition) } : {}),
    ...(reglement !== undefined ? { reglement: json(reglement) } : {}),
  };
}

const RESUME = { id: true, nom: true, emoji: true, type: true, ville: true } as const;

/** Les champs d'un lieu pour valider, avec le SOS du soir en cours */
const champsLieu = (maintenant: Date) => ({
  ...RESUME, latitude: true, longitude: true, reservable: true, ouverture: true,
  validation: { select: { validationActive: true, rayonM: true, codePublic: true } },
  _count: { select: { rattachements: { where: { statut: "valide" } } } },
  sos: { where: { arreteLe: null, jusqua: { gt: maintenant } }, take: 1, select: { id: true } },
});
type LieuBrut = { id: number; nom: string; emoji: string; type: string; ville: string; latitude: number | null; longitude: number | null; reservable: boolean; ouverture: Prisma.JsonValue;
  validation: { validationActive: boolean; rayonM: number | null; codePublic: string } | null; _count: { rattachements: number }; sos: { id: number }[] };

const versLieu = (l: LieuBrut): LieuVisite => ({
  id: l.id, nom: l.nom, emoji: l.emoji, type: l.type as TypeLieu, ville: l.ville,
  position: l.latitude !== null && l.longitude !== null ? { latitude: l.latitude, longitude: l.longitude } : null,
  reservable: l.reservable,
  validationActive: l.validation?.validationActive ?? false,
  rayonM: l.validation?.rayonM ?? null,
  codePublic: l.validation?.codePublic ?? null,
  // Le SOS du soir ne compte que pour un lieu vérifié (comme sur la fiche)
  sosEnCours: l._count.rattachements > 0 && l.sos.length > 0,
  verifie: l._count.rattachements > 0,
  ouverture: (Array.isArray(l.ouverture) ? l.ouverture : []) as CreneauOuverture[],
});

/** La carte, ses récompenses pas encore offertes (la plus ancienne d'abord) et sa demande encore valable */
const champsCarte = (maintenant: Date) => ({
  pretes: { where: { offerteLe: null }, orderBy: { gagneeLe: "asc" as const }, select: { id: true, libelle: true, alcool: true, gagneeLe: true } },
  demandes: { where: { expireLe: { gt: maintenant } }, orderBy: { creeLe: "desc" as const }, take: 1, select: { id: true, recompenseId: true, code: true, creeLe: true, expireLe: true } },
});
type CarteBrute = { id: number; compteId: number; lieuId: number; tampons: number; pretes: LigneCarte["pretes"]; demandes: NonNullable<LigneCarte["demande"]>[] };
const versCarte = ({ demandes, ...c }: CarteBrute): LigneCarte => ({ id: c.id, compteId: c.compteId, lieuId: c.lieuId, tampons: c.tampons, pretes: c.pretes, demande: demandes[0] ?? null });

function creerTables(b: Client, enTransaction: boolean): TablesVisites {
  return {
    async verrouillerCompte(compteId) {
      if (enTransaction) await b.$queryRaw`SELECT id FROM comptes WHERE id = ${compteId} FOR UPDATE`;
    },
    async verrouillerLieu(lieuId) {
      if (enTransaction) await b.$queryRaw`SELECT id FROM lieux WHERE id = ${lieuId} FOR UPDATE`;
    },

    async lireLieu(lieuId, maintenant) {
      const lieu = await b.lieu.findFirst({ where: { id: lieuId, statut: "publie" }, select: champsLieu(maintenant) });
      return lieu ? versLieu(lieu) : null;
    },
    async trouverLieuParCode(codePublic, maintenant) {
      const lieu = await b.lieu.findFirst({ where: { statut: "publie", validation: { codePublic } }, select: champsLieu(maintenant) });
      return lieu ? versLieu(lieu) : null;
    },
    async resumerLieux(ids) {
      if (ids.length === 0) return new Map();
      const lieux = await b.lieu.findMany({ where: { id: { in: ids } }, select: RESUME });
      return new Map(lieux.map((l) => [l.id, { ...l, type: l.type as TypeLieu } satisfies LieuResume]));
    },
    async listerLieuxQuiValident() {
      const lieux = await b.lieu.findMany({ where: { statut: "publie", validation: { validationActive: true } }, select: { id: true, type: true }, orderBy: { id: "asc" } });
      return lieux.map((l) => ({ id: l.id, type: l.type as TypeLieu }));
    },
    async lireComptes(ids) {
      if (ids.length === 0) return new Map();
      const comptes = await b.compte.findMany({
        where: { id: { in: ids } },
        select: {
          id: true, prenom: true, avatar: true, nomChiffre: true, dateNaissanceChiffree: true, emailVerifieLe: true,
          rattachementsLieux: { where: { statut: "valide" }, select: { lieuId: true, role: true }, orderBy: { creeLe: "asc" } },
        },
      });
      return new Map(comptes.map(({ emailVerifieLe, rattachementsLieux, ...c }) => [c.id, {
        ...c, emailVerifie: emailVerifieLe !== null, rattachements: rattachementsLieux.map((r) => ({ lieuId: r.lieuId, role: r.role as RoleRattachement })),
      }]));
    },

    async lireVisite(id) {
      const v = await b.visite.findUnique({ where: { id } });
      return v ? versVisite(v) : null;
    },
    async listerVisites({ compteId, lieuId, statuts, presentationId, reservationIds, limite }) {
      const visites = await b.visite.findMany({
        where: { compteId, lieuId, presentationId, ...(statuts ? { statut: { in: statuts } } : {}), ...(reservationIds ? { reservationId: { in: reservationIds } } : {}) },
        orderBy: [{ creeLe: "desc" }, { id: "desc" }],
        take: limite,
      });
      return visites.map(versVisite);
    },
    async creerVisite(visite) {
      const { compteId, lieuId, ...reste } = visite;
      return versVisite(await b.visite.create({ data: { compteId, lieuId, ...versDonnees(reste) } as Prisma.VisiteUncheckedCreateInput }));
    },
    async modifierVisite(id, champs) {
      await b.visite.update({ where: { id }, data: versDonnees(champs) });
    },
    async expirerDemandes(maintenant) {
      await b.visite.updateMany({ where: { statut: "demandee", expireLe: { lte: maintenant } }, data: { statut: "expiree", decideLe: maintenant } });
    },
    async listerCodesPris(lieuId, maintenant) {
      const [visites, demandes, reservations] = await Promise.all([
        b.visite.findMany({ where: { lieuId, statut: "demandee", code: { not: null }, expireLe: { gt: maintenant } }, select: { code: true } }),
        b.demandeRecompense.findMany({ where: { carte: { lieuId }, expireLe: { gt: maintenant } }, select: { code: true } }),
        b.reservation.findMany({
          where: { lieuId, statut: "acceptee", code: { not: null }, creneau: { gt: new Date(maintenant.getTime() - VENU_APRES_CRENEAU_MS) } }, select: { code: true },
        }),
      ]);
      return new Set([...visites.map((v) => v.code ?? ""), ...demandes.map((d) => d.code), ...reservations.map((r) => r.code ?? "")].filter(Boolean));
    },

    async lirePresentation(id) {
      const p = await b.presentationQr.findUnique({ where: { id } });
      return p ? versPresentation(p) : null;
    },
    async lirePresentationAffichee(lieuId, maintenant) {
      const p = await b.presentationQr.findFirst({ where: { lieuId, cacheeLe: null, expireLe: { gt: maintenant }, restantes: { gt: 0 } }, orderBy: { id: "desc" } });
      return p ? versPresentation(p) : null;
    },
    async creerPresentation({ reglement, ...p }) {
      return versPresentation(await b.presentationQr.create({ data: { ...p, reglement: json(reglement) } }));
    },
    async cacherPresentations(lieuId, maintenant) {
      await b.presentationQr.updateMany({ where: { lieuId, cacheeLe: null }, data: { cacheeLe: maintenant } });
    },
    async consommerPresentation(id) {
      const { count } = await b.presentationQr.updateMany({ where: { id, restantes: { gt: 0 } }, data: { restantes: { decrement: 1 } } });
      return count === 1;
    },

    async lireProgramme(lieuId) {
      return b.programmeFidelite.findUnique({ where: { lieuId } });
    },
    async ecrireProgramme({ lieuId, modifieLe, ...reglage }) {
      await b.programmeFidelite.upsert({ where: { lieuId }, create: { lieuId, modifieLe, ...reglage }, update: { modifieLe, ...reglage } });
    },
    async lireCarte(compteId, lieuId, maintenant) {
      const carte = await b.carteFidelite.findUnique({ where: { compteId_lieuId: { compteId, lieuId } }, include: champsCarte(maintenant) });
      return carte ? versCarte(carte) : null;
    },
    async listerCartes(filtre, maintenant) {
      const where = "compteId" in filtre ? { compteId: filtre.compteId } : { lieuId: filtre.lieuId, demandes: { some: { expireLe: { gt: maintenant } } } };
      const cartes = await b.carteFidelite.findMany({ where, include: champsCarte(maintenant), orderBy: { id: "asc" } });
      return cartes.map(versCarte);
    },
    async creerCarte(compteId, lieuId, maintenant) {
      const carte = await b.carteFidelite.upsert({ where: { compteId_lieuId: { compteId, lieuId } }, create: { compteId, lieuId }, update: {}, include: champsCarte(maintenant) });
      return versCarte(carte);
    },
    async modifierTampons(carteId, tampons) {
      await b.carteFidelite.update({ where: { id: carteId }, data: { tampons } });
    },
    async ajouterRecompense(carteId, recompense) {
      return (await b.recompensePrete.create({ data: { carteId, ...recompense }, select: { id: true } })).id;
    },
    async creerDemande(carteId, demande) {
      return b.demandeRecompense.create({ data: { carteId, ...demande }, select: { id: true, recompenseId: true, code: true, creeLe: true, expireLe: true } });
    },
    async supprimerDemandes(carteId) {
      await b.demandeRecompense.deleteMany({ where: { carteId } });
    },
    async lireDemande(id) {
      const d = await b.demandeRecompense.findUnique({ where: { id }, include: { carte: { select: { compteId: true, lieuId: true } } } });
      return d ? { id: d.id, recompenseId: d.recompenseId, code: d.code, creeLe: d.creeLe, expireLe: d.expireLe, carteId: d.carteId, ...d.carte } : null;
    },
    async offrirRecompense(recompenseId, parId, le) {
      const { count } = await b.recompensePrete.updateMany({ where: { id: recompenseId, offerteLe: null }, data: { offerteLe: le, offerteParId: parId } });
      return count === 1;
    },

    async lireReservation(id) {
      const r = await b.reservation.findUnique({ where: { id } });
      return r ? versReservation(r) : null;
    },
    async listerReservations(filtre) {
      const sens = filtre.ordre === "creneau-decroissant" ? ("desc" as const) : ("asc" as const);
      const reservations = await b.reservation.findMany({ where: ouReservations(filtre), orderBy: [{ creneau: sens }, { id: sens }], take: filtre.limite });
      return reservations.map(versReservation);
    },
    async compterReservations(filtre) {
      return b.reservation.count({ where: ouReservations(filtre) });
    },
    async creerReservation(reservation) {
      return versReservation(await b.reservation.create({ data: reservation }));
    },
    async modifierReservation(id, champs) {
      await b.reservation.update({ where: { id }, data: champs });
    },
    async expirerReservations(maintenant) {
      await b.reservation.updateMany({
        where: { statut: "demandee", creneau: { lte: new Date(maintenant.getTime() + EXPIRATION_AVANT_CRENEAU_MS) } }, data: { statut: "expiree" },
      });
    },
    async lireSosA(lieuId, instant) {
      return b.sosLieu.findFirst({
        where: {
          lieuId, creeLe: { lte: instant }, jusqua: { gt: instant }, OR: [{ arreteLe: null }, { arreteLe: { gt: instant } }],
          lieu: { rattachements: { some: { statut: "valide" } } },
        },
        orderBy: { creeLe: "desc" },
        select: { jusqua: true },
      });
    },
  };
}

export function creerDepotVisites(): DepotVisites {
  return {
    lire: (fn) => fn(creerTables(baseDeDonnees, false)),
    ecrire: (fn) => baseDeDonnees.$transaction((transaction) => fn(creerTables(transaction, true))),
  };
}
