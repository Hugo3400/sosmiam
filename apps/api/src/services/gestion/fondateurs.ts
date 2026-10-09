// Fondateurs par ville dans le logiciel de gestion (décidé le 9 octobre 2026, docs/decisions.md) : les candidatures,
// les zones (villes et départements, schéma : prisma/schema/fondateurs.prisma) et leurs places, et les deux numéros de
// carte donnés à l'acceptation (« Fondateur n° 3 de Lyon · n° 147 en France »), qui ne font que monter : jamais redonnés.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerCodeZone } from "../../fonctions/fondateurs/calculer-code-zone.ts";
import { chercherCommunes } from "../../fonctions/geo/chercher-communes.ts";
import { trouverZoneDeCommune } from "../zones-fondateurs.ts";

const ZONE = { code: true, type: true, nom: true, nomAvecDe: true, places: true } as const;
type ZoneCourte = { code: string; type: string; nom: string; nomAvecDe: string; places: number };

export type ResultatAcceptation =
  | { etat: "introuvable" }
  | { etat: "sans-zone" }
  | { etat: "complet"; zone: ZoneCourte }
  | { etat: "acceptee"; compteId: number; numeroLocal: number; numeroNational: number; zone: ZoneCourte };

/** Annule la transaction en rendant ce résultat : les numéros pris pendant la transaction ne sont pas consommés. */
class Annulation extends Error {
  resultat: ResultatAcceptation;
  constructor(resultat: ResultatAcceptation) {
    super(resultat.etat);
    this.resultat = resultat;
  }
}

/** Les candidatures d'un statut (« en-attente », « acceptee », « souvenir », « refusee » ; vide : toutes), avec leur zone. */
export async function listerCandidatures(statut: string) {
  return baseDeDonnees.candidatureFondateur.findMany({
    where: statut ? { statut } : {},
    orderBy: statut === "en-attente" ? [{ creeLe: "asc" }] : [{ zoneCode: "asc" }, { numeroLocal: "asc" }, { creeLe: "desc" }],
    take: 500,
    include: {
      zone: { select: ZONE },
      compte: { select: { id: true, prenom: true, email: true, points: true, palier: true, emailVerifieLe: true, ambassadeur: { select: { ville: true, quartier: true, statut: true } } } },
    },
  });
}

/**
 * Accepte une candidature dans sa zone : elle reçoit le numéro suivant de la zone et le numéro national suivant, s'il
 * reste une place (un fondateur « souvenir » n'en prend plus). La zone est verrouillée le temps de la transaction : deux
 * acceptations en même temps ne dépassent jamais ses places.
 */
export async function accepterCandidature(id: number, maintenant = new Date()): Promise<ResultatAcceptation> {
  try {
    return await baseDeDonnees.$transaction(async (transaction) => {
      const candidature = await transaction.candidatureFondateur.findUnique({ where: { id }, select: { statut: true, compteId: true, zoneCode: true } });
      if (!candidature || candidature.statut !== "en-attente") return { etat: "introuvable" as const };
      if (!candidature.zoneCode) return { etat: "sans-zone" as const };
      const zone = await transaction.zoneFondateur.update({
        where: { code: candidature.zoneCode },
        data: { prochainNumero: { increment: 1 } },
        select: { ...ZONE, prochainNumero: true },
      });
      const { prochainNumero, ...zoneCourte } = zone;
      const prises = await transaction.candidatureFondateur.count({ where: { zoneCode: zone.code, statut: "acceptee" } });
      if (prises >= zone.places) throw new Annulation({ etat: "complet", zone: zoneCourte });
      const compteur = await transaction.compteurFondateurs.upsert({
        where: { id: 1 },
        create: { id: 1, prochainNumeroNational: 2 },
        update: { prochainNumeroNational: { increment: 1 } },
      });
      const numeroLocal = prochainNumero - 1;
      const numeroNational = compteur.prochainNumeroNational - 1;
      const { count } = await transaction.candidatureFondateur.updateMany({
        where: { id, statut: "en-attente" },
        data: { statut: "acceptee", numeroLocal, numeroNational, reponduLe: maintenant },
      });
      // Décidée entre-temps (deux clics) : on annule tout, les numéros pris ne partent pas pour rien
      if (count === 0) throw new Annulation({ etat: "introuvable" });
      return { etat: "acceptee" as const, compteId: candidature.compteId, numeroLocal, numeroNational, zone: zoneCourte };
    });
  } catch (erreur) {
    if (erreur instanceof Annulation) return erreur.resultat;
    throw erreur;
  }
}

export async function refuserCandidature(id: number, maintenant = new Date()) {
  const { count } = await baseDeDonnees.candidatureFondateur.updateMany({ where: { id, statut: "en-attente" }, data: { statut: "refusee", reponduLe: maintenant } });
  return count > 0;
}

/** Communes qui répondent à ce qui est tapé (nom ou code postal), chacune avec la zone de fondateurs où elle compte. */
export async function chercherCommunesAvecZone(texte: string) {
  const communes = chercherCommunes(texte, 8);
  const zones = await baseDeDonnees.zoneFondateur.findMany({ where: { code: { in: communes.map(calculerCodeZone) } }, select: ZONE });
  return communes.map((commune) => ({ ...commune, zone: zones.find((zone) => zone.code === calculerCodeZone(commune)) ?? null }));
}

/**
 * Range une candidature en attente dans la zone de sa commune : une candidature d'avant la nouvelle version (sans
 * commune), ou une commune mal choisie. Rend la commune et sa zone, ou null si la candidature n'est plus en attente ou
 * que la commune est inconnue.
 */
export async function choisirCommuneCandidature(id: number, communeCode: string) {
  const trouvee = await trouverZoneDeCommune(communeCode);
  if (!trouvee) return null;
  const { count } = await baseDeDonnees.candidatureFondateur.updateMany({
    where: { id, statut: "en-attente" },
    data: { communeCode: trouvee.commune.code, zoneCode: trouvee.zone.code },
  });
  return count > 0 ? { commune: trouvee.commune.nom, zone: trouvee.zone } : null;
}

/**
 * Libère la place d'un fondateur qui a déménagé : il garde son titre et ses deux numéros (statut « souvenir »), et sa
 * place se rouvre dans sa zone (le fondateur suivant aura un nouveau numéro). Null si ce n'est pas un fondateur en place.
 */
export async function libererPlaceFondateur(id: number) {
  const candidature = await baseDeDonnees.candidatureFondateur.findFirst({ where: { id, statut: "acceptee" }, select: { compteId: true, zone: { select: ZONE } } });
  if (!candidature) return null;
  await baseDeDonnees.candidatureFondateur.update({ where: { id }, data: { statut: "souvenir" }, select: { id: true } });
  const autreVille = await estFondateurDeVille(candidature.compteId);
  return { compteId: candidature.compteId, zone: candidature.zone, encoreFondateurDeVille: autreVille };
}

/** Vrai si le compte est fondateur en place d'une ville (et pas seulement d'un département) : condition pour être
 * nommé ambassadeur de ville (décidé par Hugo le 9 octobre 2026). */
export async function estFondateurDeVille(compteId: number) {
  return (await baseDeDonnees.candidatureFondateur.count({ where: { compteId, statut: "acceptee", zone: { is: { type: "ville" } } } })) > 0;
}

/** Toutes les zones avec leurs places prises, les candidatures en attente et les anciens fondateurs, et les totaux. */
export async function listerZonesFondateurs() {
  const [zones, groupes, sansZone, compteur] = await Promise.all([
    baseDeDonnees.zoneFondateur.findMany({
      orderBy: [{ population: "desc" }],
      select: { ...ZONE, codeDepartement: true, population: true, prochainNumero: true },
    }),
    baseDeDonnees.candidatureFondateur.groupBy({ by: ["zoneCode", "statut"], where: { zoneCode: { not: null } }, _count: { _all: true } }),
    baseDeDonnees.candidatureFondateur.count({ where: { zoneCode: null, statut: "en-attente" } }),
    baseDeDonnees.compteurFondateurs.findUnique({ where: { id: 1 }, select: { prochainNumeroNational: true } }),
  ]);
  const compter = (code: string, statut: string) => groupes.find((g) => g.zoneCode === code && g.statut === statut)?._count._all ?? 0;
  const liste = zones.map((zone) => ({ ...zone, prises: compter(zone.code, "acceptee"), enAttente: compter(zone.code, "en-attente"), souvenirs: compter(zone.code, "souvenir") }));
  return {
    zones: liste,
    totaux: {
      places: liste.reduce((total, zone) => total + zone.places, 0),
      prises: liste.reduce((total, zone) => total + zone.prises, 0),
      enAttente: liste.reduce((total, zone) => total + zone.enAttente, 0) + sansZone,
      sansZone,
      prochainNumeroNational: compteur?.prochainNumeroNational ?? 1,
    },
  };
}
