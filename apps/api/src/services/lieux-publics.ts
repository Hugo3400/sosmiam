import type { CarteLieu } from "../../../../packages/commun/src/types/carte.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { presenterCarte } from "../fonctions/pro/presenter-carte.ts";

/** Ce que le public voit d'un lieu : jamais la note interne, le téléphone ni l'adresse exacte. */
export type LieuPublic = {
  id: number;
  nom: string;
  /** « resto », « patisserie », « bar » ou « sortie » */
  type: string;
  emoji: string;
  info: string;
  quartier: string;
  ville: string;
  prix: string;
  couleurs: string[];
  decouvertPar: string | null;
};

/** Les lieux publiés (statut « publie »), du plus récemment mis à jour au plus ancien, 48 au plus. */
export async function listerLieuxPublics(): Promise<LieuPublic[]> {
  return baseDeDonnees.lieu.findMany({
    where: { statut: "publie" },
    select: { id: true, nom: true, type: true, emoji: true, info: true, quartier: true, ville: true, prix: true, couleurs: true, decouvertPar: true },
    orderBy: { modifieLe: "desc" },
    take: 48,
  });
}

/** Une fiche publiée pour le plan du site : son identifiant et sa dernière modification */
export type LieuDuPlan = { id: number; modifieLe: Date };
/** Le plus d'adresses qu'un plan du site peut tenir (protocole sitemaps.org) */
export const LIEUX_DU_PLAN_MAX = 50_000;

/** Tous les lieux publiés (statut « publie »), rangés par identifiant : seulement id et modifieLe, rien d'autre. */
export async function listerLieuxDuPlan(): Promise<LieuDuPlan[]> {
  return baseDeDonnees.lieu.findMany({ where: { statut: "publie" }, select: { id: true, modifieLe: true }, orderBy: { id: "asc" }, take: LIEUX_DU_PLAN_MAX });
}

/**
 * La fiche publique d'un lieu publié (page du lieu sur le site) : ce que le lieu montre à tout le monde, contact et
 * infos pratiques compris (null ou liste vide : info inconnue, jamais affichée). Jamais la note interne de l'équipe, ni
 * qui gère le lieu : seulement `estVerifie` (au moins un rattachement validé, docs/decisions.md « Lieux vérifiés »).
 */
export type FichePublique = LieuPublic & {
  adresse: string | null; horaires: string; texte: string;
  telephone: string | null; siteWeb: string | null; instagram: string | null;
  animaux: string | null; accessible: boolean | null; terrasse: boolean | null; wifi: boolean | null; enfants: boolean | null;
  parking: boolean | null; paiements: string[]; reservation: string | null;
  estVerifie: boolean;
  /** La carte remplie par le lieu (majLe : « AAAA-MM-JJ »), ou null ; carteMajLe : le moment exact (ISO 8601), ou null */
  carte: CarteLieu | null; carteMajLe: string | null;
};

/** La fiche d'un lieu publié, ou null (absent, brouillon ou masqué). */
export async function lireFichePublique(id: number): Promise<FichePublique | null> {
  const lieu = await baseDeDonnees.lieu.findFirst({
    where: { id, statut: "publie" },
    select: {
      id: true, nom: true, type: true, emoji: true, info: true, quartier: true, ville: true, prix: true, couleurs: true, decouvertPar: true,
      adresse: true, horaires: true, texte: true, telephone: true, siteWeb: true, instagram: true, animaux: true, accessible: true,
      terrasse: true, wifi: true, enfants: true, parking: true, paiements: true, reservation: true, carte: true, carteMajLe: true,
      _count: { select: { rattachements: { where: { statut: "valide" } } } },
    },
  });
  if (!lieu) return null;
  const { _count, carte: carteGardee, carteMajLe: majLeGarde, ...fiche } = lieu;
  const { carte, majLe } = presenterCarte((carteGardee ?? null) as Omit<CarteLieu, "majLe"> | null, majLeGarde);
  return { ...fiche, estVerifie: _count.rattachements > 0, carte, carteMajLe: majLe };
}
