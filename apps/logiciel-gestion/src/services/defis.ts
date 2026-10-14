// Défis de l'app, gérés dans le logiciel (décidé par Hugo le 14 octobre 2026) : formes de packages/commun/src/types/defi.ts.
import { appeler } from "./client-gestion.ts";

export type MesureDefi = "rescousses" | "premiers-sauvetages" | "visites" | "lieux-differents" | "villes-differentes" | "semaines-d-affilee" | "avis";
export type FiltresDefi = { typesLieu?: string[]; apresHeure?: number; pendantSos?: boolean; avecPhoto?: boolean };
export type BrouillonDefi = {
  emoji: string; titre: string; texte: string; mesure: MesureDefi; filtres: FiltresDefi | null;
  objectif: number; points: number;
  /** « AAAA-MM-JJ », jours de Paris ; fin comprise, null : sans fin */
  debut: string; fin: string | null;
  publie: boolean; ordre: number;
};
export type DefiGestion = BrouillonDefi & {
  id: number;
  /** Comptes qui l'ont réussi : dès 1, la règle (mesure, filtres, objectif, premier jour) ne change plus */
  reussites: number;
  creeLe: string; modifieLe: string;
};

export const listerDefis = () => appeler<DefiGestion[]>("GET", "/defis");
export const creerDefi = (defi: BrouillonDefi) => appeler<{ ok: true; defi: DefiGestion }>("POST", "/defis", { corps: defi });
export const modifierDefi = (id: number, champs: Partial<BrouillonDefi>) => appeler<{ ok: true; defi: DefiGestion }>("PUT", `/defis/${id}`, { corps: champs });
/** Refusé (« defi-deja-reussi ») si quelqu'un l'a réussi : on le dépublie à la place */
export const supprimerDefi = (id: number) => appeler<{ ok: true }>("DELETE", `/defis/${id}`);
