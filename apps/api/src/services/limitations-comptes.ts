// Limitations des comptes dans la base (table limitations_comptes) : règles et contrat dans limitations-comptes-regles.ts.
// Prudence : tant que la table n'existe pas (migration pas encore appliquée), personne n'est limité, rien ne plante, et
// limiterCompte répond « indisponible ». Ce fichier ne lit jamais l'équipe. Jamais de motivation ni de contestation dans un
// journal.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import {
  calculerLimiteConservation, choisirLimitationEnVigueur, estIdentifiant, estLimitationActive, resumerLimitationActive, validerNouvelleLimitation,
  type LimitationLue, type ServicesLimitations,
} from "./limitations-comptes-regles.ts";

/** Ce que le service demande à la base : Prisma en vrai, une fausse base dans les tests */
export type BaseLimitations = Pick<typeof baseDeDonnees, "limitationCompte" | "$queryRaw" | "$transaction">;

/** Ni levée, ni finie : en cours ou à venir */
const pasTerminee = (maintenant: Date) => ({ leveeLe: null, OR: [{ fin: null }, { fin: { gt: maintenant } }] });

export function creerLimitationsComptes(base: BaseLimitations = baseDeDonnees): ServicesLimitations {
  /** Vrai une fois la table vue (gardé pour tout le processus) ; absente : on revérifie à chaque appel (requête légère) */
  let tableVue = false;
  async function tablePresente(): Promise<boolean> {
    if (tableVue) return true;
    const [ligne] = await base.$queryRaw<{ presente: boolean }[]>`SELECT to_regclass('limitations_comptes') IS NOT NULL AS presente`;
    tableVue = ligne?.presente === true;
    return tableVue;
  }

  /** Les limitations en cours ou à venir du compte */
  async function lireEnVigueur(compteId: number, maintenant: Date): Promise<LimitationLue[]> {
    if (!estIdentifiant(compteId) || !(await tablePresente())) return [];
    return base.limitationCompte.findMany({ where: { compteId, ...pasTerminee(maintenant) } });
  }

  const relire = async (id: number) => (await base.limitationCompte.findUnique({ where: { id } })) as LimitationLue;

  return {
    async estLimite(compteId, maintenant = new Date()) {
      const active = choisirLimitationEnVigueur(await lireEnVigueur(compteId, maintenant), maintenant);
      return active && estLimitationActive(active, maintenant) ? resumerLimitationActive(active) : null;
    },

    async lireLimitationDuCompte(compteId, maintenant = new Date()) {
      return choisirLimitationEnVigueur(await lireEnVigueur(compteId, maintenant), maintenant);
    },

    async contesterLimitation(compteId, texte, maintenant = new Date()) {
      const limitation = choisirLimitationEnVigueur(await lireEnVigueur(compteId, maintenant), maintenant);
      if (!limitation || !estLimitationActive(limitation, maintenant)) return { ok: false, erreur: "aucune-limitation" };
      if (limitation.contestation !== null) return { ok: false, erreur: "deja-conteste" };
      // Deux envois au même moment : un seul passe
      const { count } = await base.limitationCompte.updateMany({
        where: { id: limitation.id, contestation: null }, data: { contestation: texte, contesteLe: maintenant },
      });
      if (count === 0) return { ok: false, erreur: "deja-conteste" };
      return { ok: true, limitation: await relire(limitation.id) };
    },

    async limiterCompte(nouvelle, maintenant = new Date()) {
      const verifiee = validerNouvelleLimitation(nouvelle, maintenant);
      if (!verifiee.ok) return verifiee;
      if (!estIdentifiant(nouvelle.compteId)) return { ok: false, erreur: "compte-inconnu" };
      if (!(await tablePresente())) return { ok: false, erreur: "indisponible" };
      return base.$transaction(async (tx) => {
        // Le verrou du compte : deux décisions au même moment ne posent pas deux limitations
        const comptes = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM comptes WHERE id = ${nouvelle.compteId} FOR UPDATE`;
        if (comptes.length === 0) return { ok: false, erreur: "compte-inconnu" } as const;
        const deja = await tx.limitationCompte.count({ where: { compteId: nouvelle.compteId, ...pasTerminee(maintenant) } });
        if (deja > 0) return { ok: false, erreur: "deja-limite" } as const;
        const limitation = await tx.limitationCompte.create({ data: { ...verifiee.ligne, creeLe: maintenant } });
        return { ok: true, limitation } as const;
      });
    },

    async leverLimitation(id, maintenant) {
      if (!estIdentifiant(id) || !(await tablePresente())) return { ok: false, erreur: "introuvable" };
      const limitation = await base.limitationCompte.findUnique({ where: { id } });
      if (!limitation) return { ok: false, erreur: "introuvable" };
      if (limitation.leveeLe !== null || (limitation.fin !== null && limitation.fin.getTime() <= maintenant.getTime())) {
        return { ok: false, erreur: "deja-terminee" };
      }
      const { count } = await base.limitationCompte.updateMany({ where: { id, ...pasTerminee(maintenant) }, data: { leveeLe: maintenant } });
      if (count === 0) return { ok: false, erreur: "deja-terminee" };
      return { ok: true, limitation: await relire(id) };
    },

    async reexaminerLimitation(id, maintenant, { lever = false } = {}) {
      if (!estIdentifiant(id) || !(await tablePresente())) return { ok: false, erreur: "introuvable" };
      const limitation = await base.limitationCompte.findUnique({ where: { id } });
      if (!limitation) return { ok: false, erreur: "introuvable" };
      if (limitation.contestation === null) return { ok: false, erreur: "sans-contestation" };
      if (limitation.reexamineLe !== null) return { ok: false, erreur: "deja-reexaminee" };
      const court = limitation.leveeLe === null && (limitation.fin === null || limitation.fin.getTime() > maintenant.getTime());
      const { count } = await base.limitationCompte.updateMany({
        where: { id, reexamineLe: null }, data: { reexamineLe: maintenant, ...(lever && court ? { leveeLe: maintenant } : {}) },
      });
      if (count === 0) return { ok: false, erreur: "deja-reexaminee" };
      return { ok: true, limitation: await relire(id) };
    },

    async listerLimitationsDuCompte(compteId) {
      if (!estIdentifiant(compteId) || !(await tablePresente())) return [];
      return base.limitationCompte.findMany({ where: { compteId }, orderBy: [{ creeLe: "desc" }, { id: "desc" }] });
    },

    async listerContestationsAReexaminer() {
      if (!(await tablePresente())) return [];
      return base.limitationCompte.findMany({ where: { contestation: { not: null }, reexamineLe: null }, orderBy: [{ contesteLe: "asc" }, { id: "asc" }] });
    },

    async effacerLimitationsAnciennes(maintenant) {
      if (!(await tablePresente())) return 0;
      const limite = calculerLimiteConservation(maintenant);
      const { count } = await base.limitationCompte.deleteMany({ where: { OR: [{ leveeLe: { lte: limite } }, { fin: { lte: limite } }] } });
      return count;
    },
  };
}

/** Le service branché sur la vraie base (demarrer.ts) : pour les comptes, l'espace pro, le logiciel de gestion et l'app */
export const servicesLimitations = creerLimitationsComptes();

/** Les mêmes, une par une (pour la session Logiciel et la partie sociale de l'app) */
export const {
  estLimite, lireLimitationDuCompte, contesterLimitation, limiterCompte, leverLimitation, reexaminerLimitation, listerLimitationsDuCompte,
  listerContestationsAReexaminer, effacerLimitationsAnciennes,
} = servicesLimitations;
