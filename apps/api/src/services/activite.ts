// L'activité de l'app dans la base. Les rescousses d'un compte sont comptées et écrites sous verrou (la ligne du compte) :
// deux appuis en même temps ne donnent jamais une quatrième rescousse dans la semaine.
import { JOURS_LIEU_NOUVEAU } from "../../../../packages/commun/src/regles/lieux-nouveaux.ts";
import { RESCOUSSES_PAR_SEMAINE } from "../../../../packages/commun/src/regles/rescousses.ts";
import type { ActiviteApi } from "../../../../packages/commun/src/types/activite.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import type { GesteActivite, ServicesActivite } from "./activite-regles.ts";

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Les lieux, une fois chacun, dans l'ordre (du plus récent au plus ancien) */
const uniques = (ids: number[]) => [...new Set(ids)];

export function creerActivite(): ServicesActivite {
  return {
    async lireActivite(compteId: number, maintenant: Date): Promise<ActiviteApi> {
      const { semaine, mois } = calculerClesPeriodes(maintenant);
      const [rescousses, premiers, gardes, jaimes, masques, suivisLieux, suivisCreateurs] = await Promise.all([
        baseDeDonnees.rescousse.findMany({ where: { compteId }, select: { lieuId: true, semaine: true, creeLe: true }, orderBy: { creeLe: "desc" } }),
        baseDeDonnees.premierSauveteur.findMany({ where: { compteId }, select: { lieuId: true } }),
        baseDeDonnees.lieuGarde.findMany({ where: { compteId }, select: { lieuId: true }, orderBy: { creeLe: "desc" } }),
        baseDeDonnees.jaimePublication.findMany({ where: { compteId }, select: { publicationId: true }, orderBy: { creeLe: "desc" } }),
        baseDeDonnees.publicationMasquee.findMany({ where: { compteId }, select: { publicationId: true } }),
        baseDeDonnees.suiviLieu.findMany({ where: { compteId }, select: { lieuId: true, creeLe: true } }),
        baseDeDonnees.suiviCreateur.findMany({ where: { compteId }, select: { pseudo: true, creeLe: true } }),
      ]);
      const cetteSemaine = rescousses.filter((r) => r.semaine === semaine).map((r) => r.lieuId);
      const suivis = [
        ...suivisLieux.map((s) => ({ cle: `lieu:${s.lieuId}`, le: s.creeLe })),
        ...suivisCreateurs.map((s) => ({ cle: `createur:${s.pseudo}`, le: s.creeLe })),
      ].sort((a, b) => b.le.getTime() - a.le.getTime());
      return {
        semaine,
        restantes: Math.max(0, RESCOUSSES_PAR_SEMAINE - cetteSemaine.length),
        rescoussesSemaine: cetteSemaine,
        lieuxSauves: uniques(rescousses.map((r) => r.lieuId)),
        rescoussesDonnees: rescousses.length,
        rescoussesDuMois: rescousses.filter((r) => calculerClesPeriodes(r.creeLe).mois === mois).length,
        premiersSauvetages: premiers.map((p) => p.lieuId),
        gardes: gardes.map((g) => g.lieuId),
        jaimes: jaimes.map((j) => String(j.publicationId)),
        masques: masques.map((m) => String(m.publicationId)),
        suivis: suivis.map((s) => s.cle),
      };
    },

    async donnerRescousse(compteId: number, lieuId: number, maintenant: Date) {
      const lieu = await baseDeDonnees.lieu.findFirst({
        where: { id: lieuId, statut: "publie" },
        select: { publieLe: true, _count: { select: { rattachements: { where: { statut: "valide" } } } } },
      });
      if (!lieu) return { ok: false, erreur: "lieu-inconnu" } as const;
      if (lieu._count.rattachements === 0) return { ok: false, erreur: "lieu-non-verifie" } as const;
      const nouveau = lieu.publieLe !== null && maintenant.getTime() - lieu.publieLe.getTime() < JOURS_LIEU_NOUVEAU * JOUR_MS;
      const { semaine } = calculerClesPeriodes(maintenant);
      return baseDeDonnees.$transaction(async (transaction) => {
        // Verrou sur le compte : le compte et l'écriture se suivent sans qu'un autre geste du même compte s'intercale
        await transaction.$queryRaw`SELECT id FROM comptes WHERE id = ${compteId} FOR UPDATE`;
        const deja = await transaction.rescousse.findUnique({ where: { compteId_lieuId_semaine: { compteId, lieuId, semaine } }, select: { id: true } });
        if (deja) return { ok: true, deja: true, premierSauveteur: false } as const;
        const donnees = await transaction.rescousse.count({ where: { compteId, semaine } });
        if (donnees >= RESCOUSSES_PAR_SEMAINE) return { ok: false, erreur: "plus-de-rescousse" } as const;
        await transaction.rescousse.create({ data: { compteId, lieuId, semaine, creeLe: maintenant } });
        // Un seul premier sauveteur par lieu (clé primaire) : le premier qui l'écrit l'a
        const premier = nouveau ? (await transaction.premierSauveteur.createMany({ data: [{ lieuId, compteId, creeLe: maintenant }], skipDuplicates: true })).count === 1 : false;
        return { ok: true, deja: false, premierSauveteur: premier } as const;
      });
    },

    async reprendreRescousse(compteId: number, lieuId: number, maintenant: Date) {
      const { semaine } = calculerClesPeriodes(maintenant);
      return baseDeDonnees.$transaction(async (transaction) => {
        const { count } = await transaction.rescousse.deleteMany({ where: { compteId, lieuId, semaine } });
        if (count === 0) return { ok: true, reprise: false, premierSauveteurRetire: false } as const;
        const encore = await transaction.rescousse.count({ where: { compteId, lieuId } });
        const retire = encore === 0 ? (await transaction.premierSauveteur.deleteMany({ where: { lieuId, compteId } })).count > 0 : false;
        return { ok: true, reprise: true, premierSauveteurRetire: retire } as const;
      });
    },

    async basculer(compteId: number, geste: GesteActivite, oui: boolean) {
      if (geste.quoi === "garde" || geste.quoi === "suivi-lieu") {
        const cle = { compteId_lieuId: { compteId, lieuId: geste.lieuId } };
        const table = geste.quoi === "garde" ? baseDeDonnees.lieuGarde : baseDeDonnees.suiviLieu;
        if (!oui) {
          await (table as typeof baseDeDonnees.lieuGarde).deleteMany({ where: { compteId, lieuId: geste.lieuId } });
          return { ok: true } as const;
        }
        const lieu = await baseDeDonnees.lieu.findFirst({ where: { id: geste.lieuId, statut: "publie" }, select: { id: true } });
        if (!lieu) return { ok: false, erreur: "lieu-inconnu" } as const;
        await (table as typeof baseDeDonnees.lieuGarde).upsert({ where: cle, create: { compteId, lieuId: geste.lieuId }, update: {} });
        return { ok: true } as const;
      }
      if (geste.quoi === "suivi-createur") {
        if (!oui) await baseDeDonnees.suiviCreateur.deleteMany({ where: { compteId, pseudo: geste.pseudo } });
        else await baseDeDonnees.suiviCreateur.upsert({ where: { compteId_pseudo: { compteId, pseudo: geste.pseudo } }, create: { compteId, pseudo: geste.pseudo }, update: {} });
        return { ok: true } as const;
      }
      const table = geste.quoi === "jaime" ? baseDeDonnees.jaimePublication : baseDeDonnees.publicationMasquee;
      if (!oui) {
        await (table as typeof baseDeDonnees.jaimePublication).deleteMany({ where: { compteId, publicationId: geste.publicationId } });
        return { ok: true } as const;
      }
      const publication = await baseDeDonnees.publication.findFirst({ where: { id: geste.publicationId, statut: "publiee" }, select: { id: true } });
      if (!publication) return { ok: false, erreur: "publication-inconnue" } as const;
      await (table as typeof baseDeDonnees.jaimePublication).upsert({
        where: { compteId_publicationId: { compteId, publicationId: geste.publicationId } },
        create: { compteId, publicationId: geste.publicationId },
        update: {},
      });
      return { ok: true } as const;
    },
  };
}
