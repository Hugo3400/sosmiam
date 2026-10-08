// Ambassadeurs dans le logiciel de gestion : les comptes de l'espace ambassadeur.sosmiam.fr (modèle et règles des
// points : services/comptes.ts), leurs décisions, leurs candidatures fondateur, le classement et la couverture des villes.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";

const UN_JOUR = 86_400_000;
/** Un compte sans visite connectée depuis 1 an est effacé ; on prévient 30 jours avant (décision du 8 octobre 2026) */
const INACTIVITE_MAX = 365 * UN_JOUR;
const PREVENIR_AVANT = 30 * UN_JOUR;
/** Nombre de fondateurs (numéros 1 à 10) */
const FONDATEURS_MAX = 10;

export type StatutAmbassadeur = "en-attente" | "actif" | "refuse" | "suspendu";
export type FiltresAmbassadeurs = { statut: string; palier: string; recherche: string; ville: string };

export async function listerAmbassadeurs({ statut, palier, recherche, ville }: FiltresAmbassadeurs, maintenant = new Date()) {
  const ou: Prisma.CompteWhereInput = {
    ambassadeur: { is: { ...(statut ? { statut } : {}), ...(ville ? { ville: { equals: ville, mode: "insensitive" } } : {}) } },
    ...(palier ? { palier } : {}),
    ...(recherche
      ? { OR: [{ prenom: { contains: recherche, mode: "insensitive" } }, { email: { contains: recherche, mode: "insensitive" } }, { ambassadeur: { is: { quartier: { contains: recherche, mode: "insensitive" } } } }] }
      : {}),
  };
  const limiteAlerte = new Date(maintenant.getTime() - INACTIVITE_MAX + PREVENIR_AVANT);
  const [comptes, parStatut, bientotEffaces] = await Promise.all([
    baseDeDonnees.compte.findMany({
      where: ou,
      orderBy: [{ creeLe: "desc" }],
      take: 300,
      select: {
        id: true, prenom: true, email: true, points: true, palier: true, creeLe: true, derniereConnexion: true,
        ambassadeur: { select: { statut: true, ville: true, quartier: true, decideLe: true } },
        _count: { select: { badges: true, demandesLieux: true } },
      },
    }),
    baseDeDonnees.ambassadeur.groupBy({ by: ["statut"], _count: { _all: true } }),
    baseDeDonnees.compte.count({ where: { ambassadeur: { isNot: null }, derniereConnexion: { lt: limiteAlerte } } }),
  ]);
  return {
    compteurs: Object.fromEntries(parStatut.map((g) => [g.statut, g._count._all])),
    bientotEffaces,
    ambassadeurs: comptes.map((compte) => ({
      ...compte,
      effaceLe: new Date(compte.derniereConnexion.getTime() + INACTIVITE_MAX).toISOString(),
      bientotEfface: compte.derniereConnexion < limiteAlerte,
    })),
  };
}

/** Tout ce qu'on sait d'un ambassadeur, pour sa fiche dans le logiciel (jamais son mot de passe). */
export async function lireAmbassadeur(id: number) {
  const compte = await baseDeDonnees.compte.findUnique({
    where: { id },
    select: {
      id: true, prenom: true, email: true, points: true, palier: true, cguVersion: true, creeLe: true, derniereConnexion: true,
      ambassadeur: true,
      badges: { orderBy: { obtenuLe: "asc" } },
      journalPoints: { orderBy: { creeLe: "desc" }, take: 50 },
      candidatures: { orderBy: { creeLe: "desc" } },
      demandesLieux: { orderBy: { creeLe: "desc" }, take: 30, select: { id: true, nom: true, ville: true, statut: true, creeLe: true, lieuId: true } },
      missions: { orderBy: { creeLe: "desc" }, take: 30, include: { lieu: { select: { id: true, nom: true, emoji: true } } } },
      messages: { orderBy: { creeLe: "desc" }, take: 30 },
      _count: { select: { sessions: true } },
    },
  });
  if (!compte) return null;
  return { ...compte, effaceLe: new Date(compte.derniereConnexion.getTime() + INACTIVITE_MAX).toISOString() };
}

/**
 * Décision de l'équipe : valider (« actif »), refuser, suspendre ou réactiver. Seul l'espace ambassadeur est concerné :
 * le compte sert aussi à l'app (décision du 8 octobre 2026), ses sessions restent ouvertes et l'espace lui est fermé
 * parce que le statut est relu à chaque demande (exigerAmbassadeurActif). Null si ce n'est pas un ambassadeur.
 */
export async function deciderAmbassadeur(id: number, statut: StatutAmbassadeur, maintenant = new Date()) {
  const ambassadeur = await baseDeDonnees.ambassadeur.findUnique({ where: { compteId: id }, select: { statut: true, compte: { select: { prenom: true } } } });
  if (!ambassadeur) return null;
  await baseDeDonnees.ambassadeur.update({ where: { compteId: id }, data: { statut, decideLe: maintenant } });
  return { prenom: ambassadeur.compte.prenom, avant: ambassadeur.statut };
}

/**
 * Retire le rôle d'ambassadeur (la personne arrête, ou l'équipe le décide) : sa fiche d'ambassadeur, ses missions,
 * ses messages personnels et ses candidatures fondateur partent ; le compte, l'app, ses points et ses badges restent.
 */
export async function retirerDuProgramme(id: number) {
  const ambassadeur = await baseDeDonnees.ambassadeur.findUnique({ where: { compteId: id }, select: { compte: { select: { prenom: true } } } });
  if (!ambassadeur) return null;
  await baseDeDonnees.$transaction([
    baseDeDonnees.missionAmbassadeur.deleteMany({ where: { compteId: id } }),
    baseDeDonnees.messageAmbassadeur.deleteMany({ where: { compteId: id } }),
    baseDeDonnees.candidatureFondateur.deleteMany({ where: { compteId: id } }),
    baseDeDonnees.ambassadeur.delete({ where: { compteId: id } }),
  ]);
  return { prenom: ambassadeur.compte.prenom };
}

export type ModificationAmbassadeur = { ville?: string; quartier?: string | null; noteEquipe?: string | null };

export async function modifierAmbassadeur(id: number, modification: ModificationAmbassadeur) {
  return baseDeDonnees.ambassadeur.update({ where: { compteId: id }, data: modification }).catch(() => null);
}

/** Prénom d'un compte d'ambassadeur (null s'il n'existe pas) : pour vérifier avant d'agir, et pour le journal. */
export async function lirePrenom(id: number): Promise<string | null> {
  const compte = await baseDeDonnees.compte.findFirst({ where: { id, ambassadeur: { isNot: null } }, select: { prenom: true } });
  return compte?.prenom ?? null;
}

/** Supprime tout le compte pour de vrai (demande de la personne, RGPD), app comprise : tout ce qui lui est lié part avec lui. */
export async function supprimerCompte(id: number) {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id }, select: { prenom: true } });
  if (!compte) return null;
  await baseDeDonnees.compte.delete({ where: { id } });
  return compte;
}

// ─── Candidatures fondateur ───

export async function listerCandidatures(statut: string) {
  return baseDeDonnees.candidatureFondateur.findMany({
    where: statut ? { statut } : {},
    orderBy: { creeLe: statut === "en-attente" ? "asc" : "desc" },
    take: 100,
    include: { compte: { select: { id: true, prenom: true, email: true, points: true, palier: true, ambassadeur: { select: { ville: true, quartier: true, statut: true } } } } },
  });
}

/** Accepte une candidature : elle reçoit le premier numéro de fondateur libre (1 à 10). Null si impossible. */
export async function accepterCandidature(id: number, maintenant = new Date()) {
  const candidature = await baseDeDonnees.candidatureFondateur.findUnique({ where: { id } });
  if (!candidature || candidature.statut !== "en-attente") return null;
  const pris = new Set((await baseDeDonnees.candidatureFondateur.findMany({ where: { numero: { not: null } }, select: { numero: true } })).map((c) => c.numero));
  const numero = Array.from({ length: FONDATEURS_MAX }, (_, i) => i + 1).find((n) => !pris.has(n));
  if (!numero) return { complet: true as const };
  await baseDeDonnees.candidatureFondateur.update({ where: { id }, data: { statut: "acceptee", numero, reponduLe: maintenant } });
  return { complet: false as const, numero, compteId: candidature.compteId };
}

export async function refuserCandidature(id: number, maintenant = new Date()) {
  const { count } = await baseDeDonnees.candidatureFondateur.updateMany({ where: { id, statut: "en-attente" }, data: { statut: "refusee", reponduLe: maintenant } });
  return count > 0;
}

// ─── Classement, couverture, export ───

/** Classement des ambassadeurs actifs : depuis toujours, et sur le mois en cours (d'après le journal des points). */
export async function lireClassement(maintenant = new Date()) {
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const [toujours, mois] = await Promise.all([
    baseDeDonnees.compte.findMany({
      where: { ambassadeur: { is: { statut: "actif" } } },
      orderBy: { points: "desc" },
      take: 50,
      select: { id: true, prenom: true, points: true, palier: true, ambassadeur: { select: { ville: true } }, badges: { select: { badge: true } } },
    }),
    baseDeDonnees.journalPoints.groupBy({ by: ["compteId"], where: { creeLe: { gte: debutMois } }, _sum: { points: true }, orderBy: { _sum: { points: "desc" } }, take: 50 }),
  ]);
  const noms = new Map(
    (await baseDeDonnees.compte.findMany({ where: { id: { in: mois.map((m) => m.compteId) } }, select: { id: true, prenom: true, ambassadeur: { select: { ville: true } } } }))
      .map((c) => [c.id, c]),
  );
  return {
    toujours,
    mois: mois.map((m) => ({ id: m.compteId, prenom: noms.get(m.compteId)?.prenom ?? "?", ville: noms.get(m.compteId)?.ambassadeur?.ville ?? "", points: m._sum.points ?? 0 })),
  };
}

/** Couverture : ambassadeurs actifs par ville et par quartier, et villes qui ont des lieux mais pas encore d'ambassadeur. */
export async function lireCouverture() {
  const [ambassadeurs, lieux] = await Promise.all([
    baseDeDonnees.ambassadeur.groupBy({ by: ["ville", "quartier"], where: { statut: "actif" }, _count: { _all: true } }),
    baseDeDonnees.lieu.groupBy({ by: ["ville"], where: { statut: "publie" }, _count: { _all: true } }),
  ]);
  const villes = new Map<string, { ville: string; ambassadeurs: number; lieux: number; quartiers: { quartier: string; ambassadeurs: number }[] }>();
  const cle = (ville: string) => ville.trim().toLowerCase();
  for (const groupe of ambassadeurs) {
    const v = villes.get(cle(groupe.ville)) ?? { ville: groupe.ville, ambassadeurs: 0, lieux: 0, quartiers: [] };
    v.ambassadeurs += groupe._count._all;
    v.quartiers.push({ quartier: groupe.quartier ?? "Quartier non précisé", ambassadeurs: groupe._count._all });
    villes.set(cle(groupe.ville), v);
  }
  for (const groupe of lieux) {
    const v = villes.get(cle(groupe.ville)) ?? { ville: groupe.ville, ambassadeurs: 0, lieux: 0, quartiers: [] };
    v.lieux += groupe._count._all;
    villes.set(cle(groupe.ville), v);
  }
  return [...villes.values()].sort((a, b) => b.ambassadeurs - a.ambassadeurs || b.lieux - a.lieux);
}

/** Les ambassadeurs en CSV (séparateur « ; »), sans la note de l'équipe. */
export async function exporterAmbassadeurs(): Promise<string> {
  const comptes = await baseDeDonnees.compte.findMany({
    where: { ambassadeur: { isNot: null } },
    orderBy: { creeLe: "asc" },
    select: { prenom: true, email: true, points: true, palier: true, creeLe: true, derniereConnexion: true, ambassadeur: { select: { statut: true, ville: true, quartier: true } } },
  });
  const proteger = (valeur: string) => (/[";\n]|^[=+\-@]/.test(valeur) ? `"${valeur.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : valeur);
  const lignes = comptes.map((c) =>
    [c.prenom, c.email, c.ambassadeur?.statut ?? "", c.ambassadeur?.ville ?? "", c.ambassadeur?.quartier ?? "", c.palier, String(c.points),
      c.creeLe.toISOString().slice(0, 10), c.derniereConnexion.toISOString().slice(0, 10)].map(proteger).join(";"),
  );
  return ["prenom;email;statut;ville;quartier;palier;points;inscrit_le;derniere_visite", ...lignes].join("\r\n") + "\r\n";
}
