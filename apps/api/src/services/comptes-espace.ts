// Ce qu'un ambassadeur validé (« actif ») fait depuis son espace : candidater pour être fondateur de sa ville (ou de son
// département : « Fondateurs par ville », docs/decisions.md), et proposer des lieux (ils arrivent dans la file des
// demandes du logiciel de gestion, liés à son compte).
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { CommuneVue, ZoneVue } from "./zones-fondateurs.ts";

/** « souvenir » : fondateur qui a déménagé ; il garde son titre et ses numéros, sa place s'est libérée */
export type StatutCandidature = "en-attente" | "acceptee" | "refusee" | "souvenir";

/** La dernière candidature « fondateur » d'un compte, telle que la base la garde (dates en ISO 8601) */
export type CandidatureBrute = {
  statut: StatutCandidature;
  numeroLocal: number | null;
  numeroNational: number | null;
  /** Null pour une candidature envoyée avant les fondateurs par ville */
  communeCode: string | null;
  zoneCode: string | null;
  creeLe: string;
  reponduLe: string | null;
};

/**
 * La candidature telle que l'ambassadeur la voit. `numero` = `numeroLocal`, gardé pour le site d'avant les fondateurs par
 * ville (il lisait « numero ») ; à retirer quand le site n'en aura plus besoin.
 */
export type CandidatureVue = {
  statut: StatutCandidature;
  numero: number | null;
  numeroLocal: number | null;
  numeroNational: number | null;
  commune: Pick<CommuneVue, "code" | "nom" | "nomDepartement"> | null;
  zone: ZoneVue | null;
  creeLe: string;
  reponduLe: string | null;
};

/** Où la personne candidate : sa commune (code INSEE) et la zone calculée par l'API */
export type LieuCandidature = { communeCode: string; zoneCode: string };

/** Changer la commune d'une candidature : faite, aucune candidature, ou plus en attente */
export type ResultatChangementCommune = "ok" | "aucune" | "deja-traitee";

export type NouvelleCandidature = {
  pepites: string;
  /** Parmi « denicher », « fiches », « selections », « faire-savoir » */
  envies: string[];
  reseaux: string | null;
  motivation: string;
  partantRencontre: boolean;
  connuPar: string | null;
};

/** Une proposition de lieu telle que l'ambassadeur la voit dans « Mes propositions » */
export type PropositionVue = { id: number; nom: string; ville: string; statut: "a-traiter" | "acceptee" | "refusee"; creeLe: string };

/** Mêmes champs que « J'inscris mon lieu » (POST /demandes-lieux), sans la partie contact */
export type NouvelleProposition = {
  nom: string;
  type: string | null;
  ville: string;
  adresse: string | null;
  description: string;
  plat: string | null;
  horaires: string | null;
  siteWeb: string | null;
  instagram: string | null;
};

/** Sa dernière candidature fondateur, ou null s'il n'en a jamais envoyé (ou si la dernière refusée a été effacée). */
export async function lireCandidature(compteId: number): Promise<CandidatureBrute | null> {
  const candidature = await baseDeDonnees.candidatureFondateur.findFirst({
    where: { compteId },
    orderBy: [{ creeLe: "desc" }, { id: "desc" }],
    select: { statut: true, numeroLocal: true, numeroNational: true, communeCode: true, zoneCode: true, creeLe: true, reponduLe: true },
  });
  if (!candidature) return null;
  return {
    ...candidature,
    statut: candidature.statut as StatutCandidature,
    creeLe: candidature.creeLe.toISOString(),
    reponduLe: candidature.reponduLe?.toISOString() ?? null,
  };
}

/**
 * Enregistre la candidature, dans la zone calculée d'après sa commune ; faux s'il en a déjà une en attente ou acceptée
 * (après un refus, ou en « souvenir » après un déménagement, il peut recandidater). Les places de la zone sont vérifiées
 * avant (controleurs/comptes-espace.ts), et de nouveau par l'équipe à l'acceptation.
 */
export async function creerCandidature(compteId: number, { envies, ...candidature }: NouvelleCandidature & LieuCandidature): Promise<boolean> {
  return baseDeDonnees.$transaction(async (transaction) => {
    const enCours = await transaction.candidatureFondateur.count({ where: { compteId, statut: { in: ["en-attente", "acceptee"] } } });
    if (enCours > 0) return false;
    await transaction.candidatureFondateur.create({ data: { ...candidature, compteId, envies: envies.join(",") } });
    return true;
  });
}

/**
 * Pose ou change la commune (et la zone) de sa dernière candidature, seulement si elle est encore en attente : une
 * candidature d'avant les fondateurs par ville, ou une commune mal choisie.
 */
export async function changerCommuneCandidature(compteId: number, { communeCode, zoneCode }: LieuCandidature): Promise<ResultatChangementCommune> {
  const derniere = await baseDeDonnees.candidatureFondateur.findFirst({
    where: { compteId },
    orderBy: [{ creeLe: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  if (!derniere) return "aucune";
  const { count } = await baseDeDonnees.candidatureFondateur.updateMany({ where: { id: derniere.id, statut: "en-attente" }, data: { communeCode, zoneCode } });
  return count === 1 ? "ok" : "deja-traitee";
}

/** Ses propositions de lieux, les plus récentes d'abord. */
export async function listerPropositions(compteId: number): Promise<PropositionVue[]> {
  const propositions = await baseDeDonnees.demandeLieu.findMany({
    where: { compteId },
    orderBy: [{ creeLe: "desc" }, { id: "desc" }],
    take: 100,
    select: { id: true, nom: true, ville: true, statut: true, creeLe: true },
  });
  return propositions.map((proposition) => ({
    ...proposition,
    statut: proposition.statut as PropositionVue["statut"],
    creeLe: proposition.creeLe.toISOString(),
  }));
}

/** Une pépite proposée : elle rejoint la file des demandes du logiciel de gestion, liée à son compte (« Déniché par »). */
export async function creerProposition(compteId: number, proposition: NouvelleProposition): Promise<void> {
  await baseDeDonnees.demandeLieu.create({ data: { ...proposition, origine: "ambassadeur", compteId } });
}
