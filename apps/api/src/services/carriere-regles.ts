import type {
  CandidatureGestion, DonneesOffreCarriere, NouvelleCandidature, OffreCarriere, OffreCarriereGestion, StatutCandidature,
} from "../../../../packages/commun/src/types/carriere.ts";
import type { ChiffrementCarriere } from "./chiffrement-carriere.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

export const JOUR_MS = 86_400_000;
export const DUREE_CONSERVATION_CANDIDATURE_MS = 183 * JOUR_MS;
export const DELAI_ORPHELIN_CV_MS = 24 * 3600_000;
export const FENETRE_CANDIDATURES_EMAIL_MS = JOUR_MS;
export const CANDIDATURES_PAR_EMAIL = 3;
export const CV_OCTETS_MAX = 5 * 1024 * 1024;
export const LIEU_OFFRE_PAR_DEFAUT = "À distance, partout en France";
export const STATUTS_CANDIDATURE: readonly StatutCandidature[] = ["nouvelle", "lue", "retenue", "non-retenue"];
export const CANDIDATURES_PAR_LISTE = 500;
export const FICHIERS_PAR_PASSAGE = 200;
export const TEXTE_ILLISIBLE = "🔒 Illisible (clé de chiffrement absente)";
export const FORME_ID_CANDIDATURE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export type OffreEnBase = DonneesOffreCarriere & {
  id: number;
  publieeLe: Date | null;
  fermeeLe: Date | null;
  creeLe: Date;
  modifieLe: Date;
};

export type CompteCandidatures = { candidatures: number; nouvelles: number };

export type CandidatureEnBase = {
  id: string;
  offreId: number;
  nomChiffre: string;
  emailChiffre: string;
  emailEmpreinte: string;
  messageChiffre: string;
  lienChiffre: string | null;
  cvFichier: string | null;
  statut: StatutCandidature;
  creeLe: Date;
  lueLe: Date | null;
};

export type ChiffresCandidature = Pick<CandidatureEnBase, "nomChiffre" | "emailChiffre" | "messageChiffre" | "lienChiffre" | "cvFichier">;

export type ChangementsOffre = Partial<DonneesOffreCarriere> & { publieeLe?: Date | null; fermeeLe?: Date | null };

export type DepotCarriere = {
  listerOffresOuvertes: (maintenant: Date) => Promise<OffreEnBase[]>;
  listerOffres: () => Promise<OffreEnBase[]>;
  lireOffre: (id: number) => Promise<OffreEnBase | null>;
  compterCandidatures: (offreIds: readonly number[]) => Promise<Map<number, CompteCandidatures>>;
  creerOffre: (donnees: DonneesOffreCarriere, maintenant: Date) => Promise<OffreEnBase>;
  modifierOffre: (id: number, changements: ChangementsOffre, maintenant: Date) => Promise<OffreEnBase | null>;
  supprimerOffre: (id: number) => Promise<{ cvFichiers: string[] } | null>;
  listerDepotsEmail: (empreinte: string, depuis: Date) => Promise<Date[]>;
  ajouterCandidature: (candidature: CandidatureEnBase) => Promise<void>;
  listerCandidatures: (filtres: { offreId?: number; statut?: StatutCandidature }, nombre: number) => Promise<(CandidatureEnBase & { offreTitre: string })[]>;
  listerCandidaturesApres: (apres: string | null, nombre: number) => Promise<CandidatureEnBase[]>;
  lireCandidature: (id: string) => Promise<CandidatureEnBase | null>;
  changerStatut: (id: string, statut: StatutCandidature, lueLe: Date | null) => Promise<boolean>;
  remplacerChiffres: (id: string, cvAvant: string | null, chiffres: ChiffresCandidature) => Promise<boolean>;
  supprimerCandidature: (id: string) => Promise<{ cvFichier: string | null } | null>;
  effacerCandidaturesAvant: (limite: Date) => Promise<{ nombre: number; cvFichiers: string[] }>;
  listerCvCites: (fichiers: readonly string[]) => Promise<Set<string>>;
};

export type DependancesCarriere = {
  depot: DepotCarriere;
  stockage: StockageMediasChat;
  chiffrement: ChiffrementCarriere | null;
  horloge?: () => number;
};

export type ErreurDepotCandidature =
  | "offre-inconnue"
  | "offre-fermee"
  | "cv-trop-lourd"
  | "cv-format"
  | "trop-de-demandes"
  | "chiffrement-indisponible"
  | "stockage-plein";

export type ResultatDepotCandidature =
  | { ok: true }
  | { ok: false; erreur: ErreurDepotCandidature; reessayerDans?: number }
  | { ok: false; erreur: "champ-invalide"; champ: string };

export type ResultatOffreGestion =
  | { ok: true; offre: OffreCarriereGestion }
  | { ok: false; erreur: "champ-invalide"; champ: string }
  | { ok: false; erreur: "offre-inconnue" };

export type ResultatStatutCandidature = { ok: true } | { ok: false; erreur: "candidature-inconnue" | "champ-invalide" };

export type FiltresCandidatures = { offreId?: string; statut?: StatutCandidature };

export type BilanMenageCarriere = {
  candidatures: number;
  cv: number;
  orphelins: number;
  rechiffrees: number;
  illisibles: number;
};

export type ServicesCarrierePublics = {
  listerOffresPubliees: () => Promise<OffreCarriere[]>;
  lireOffrePubliee: (id: string) => Promise<OffreCarriere | null>;
  deposerCandidature: (offreId: string, candidature: NouvelleCandidature, maintenant?: Date) => Promise<ResultatDepotCandidature>;
};

export type ServicesCarriereGestion = {
  listerOffresGestion: () => Promise<OffreCarriereGestion[]>;
  creerOffre: (donnees: unknown, maintenant?: Date) => Promise<ResultatOffreGestion>;
  modifierOffre: (id: string, donnees: unknown, maintenant?: Date) => Promise<ResultatOffreGestion>;
  publierOffre: (id: string, maintenant?: Date) => Promise<OffreCarriereGestion | null>;
  fermerOffre: (id: string, maintenant?: Date) => Promise<OffreCarriereGestion | null>;
  supprimerOffre: (id: string) => Promise<boolean>;
  listerCandidatures: (filtres?: FiltresCandidatures) => Promise<CandidatureGestion[]>;
  lireCvCandidature: (id: string) => Promise<Buffer | null>;
  changerStatutCandidature: (id: string, statut: unknown, maintenant?: Date) => Promise<ResultatStatutCandidature>;
  supprimerCandidature: (id: string) => Promise<boolean>;
};
