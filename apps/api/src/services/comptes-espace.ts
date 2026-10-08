// Ce qu'un ambassadeur validé (« actif ») fait depuis son espace : candidater pour être l'un des 10 fondateurs, et
// proposer des lieux (ils arrivent dans la file des demandes du logiciel de gestion, liés à son compte).
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { FONDATEURS_MAX } from "./gestion/ambassadeurs.ts";

export type StatutCandidature = "en-attente" | "acceptee" | "refusee";

/** La candidature « fondateur » telle que l'ambassadeur la voit (dates en ISO 8601) */
export type CandidatureVue = { statut: StatutCandidature; numero: number | null; creeLe: string; reponduLe: string | null };

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
export async function lireCandidature(compteId: number): Promise<CandidatureVue | null> {
  const candidature = await baseDeDonnees.candidatureFondateur.findFirst({
    where: { compteId },
    orderBy: [{ creeLe: "desc" }, { id: "desc" }],
    select: { statut: true, numero: true, creeLe: true, reponduLe: true },
  });
  if (!candidature) return null;
  return {
    statut: candidature.statut as StatutCandidature,
    numero: candidature.numero,
    creeLe: candidature.creeLe.toISOString(),
    reponduLe: candidature.reponduLe?.toISOString() ?? null,
  };
}

/**
 * Places de fondateur encore libres : 10 moins les numéros donnés (même règle que accepterCandidature, dans
 * services/gestion/ambassadeurs.ts), jamais moins de 0. Recomptées à chaque demande : une place se libère si un fondateur
 * quitte le programme ou efface son compte.
 */
export async function compterPlacesFondateur(): Promise<number> {
  const donnes = await baseDeDonnees.candidatureFondateur.findMany({
    where: { numero: { gte: 1, lte: FONDATEURS_MAX } },
    distinct: ["numero"],
    select: { numero: true },
  });
  return Math.max(0, FONDATEURS_MAX - donnes.length);
}

/** Enregistre la candidature ; faux s'il en a déjà une en attente ou acceptée (après un refus, il peut recandidater). */
export async function creerCandidature(compteId: number, { envies, ...candidature }: NouvelleCandidature): Promise<boolean> {
  return baseDeDonnees.$transaction(async (transaction) => {
    const enCours = await transaction.candidatureFondateur.count({ where: { compteId, statut: { in: ["en-attente", "acceptee"] } } });
    if (enCours > 0) return false;
    await transaction.candidatureFondateur.create({ data: { ...candidature, compteId, envies: envies.join(",") } });
    return true;
  });
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
