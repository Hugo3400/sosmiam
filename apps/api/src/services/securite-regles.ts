import type {
  CibleSignalementSecurite, EntreeTableauHonneur, GraviteSignalementSecurite, NouveauSignalementSecurite, SignalementSecuriteGestion,
  StatutSignalementSecurite,
} from "../../../../packages/commun/src/types/securite.ts";
import type { ChiffrementSecurite } from "./chiffrement-securite.ts";
import type { NettoyerJpeg } from "./nettoyeur-jpeg.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

export const JOUR_MS = 86_400_000;
export const FENETRE_SIGNALEMENTS_EMAIL_MS = JOUR_MS;
export const SIGNALEMENTS_PAR_EMAIL = 3;
export const DELAI_ORPHELIN_IMAGE_MS = 24 * 3600_000;
export const SIGNALEMENTS_PAR_LISTE = 300;
export const ENTREES_TABLEAU_MAX = 500;
export const FICHIERS_PAR_PASSAGE = 200;
export const BADGE_CHASSEUR_DE_BUGS = "chasseur-de-bugs";
export const TEXTE_ILLISIBLE = "🔒 Illisible (clé de chiffrement absente)";
export const FORME_ID_SIGNALEMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const STATUTS_SIGNALEMENT_SECURITE: readonly StatutSignalementSecurite[] = ["nouveau", "en-cours", "corrige", "non-retenu", "doublon"];
export const GRAVITES_SIGNALEMENT_SECURITE: readonly GraviteSignalementSecurite[] = ["critique", "haute", "moyenne", "basse"];

export type SignalementEnBase = {
  id: string;
  nomChiffre: string;
  emailChiffre: string;
  emailEmpreinte: string;
  cible: CibleSignalementSecurite;
  titreChiffre: string;
  descriptionChiffree: string;
  lienChiffre: string | null;
  images: string[];
  nomTableauChiffre: string | null;
  statut: StatutSignalementSecurite;
  gravite: GraviteSignalementSecurite | null;
  creeLe: Date;
  clotureLe: Date | null;
  badgeDonneLe: Date | null;
};

export type SignalementAvecTableau = SignalementEnBase & { auTableauHonneur: boolean };

export type ChiffresSignalement = Pick<SignalementEnBase, "nomChiffre" | "emailChiffre" | "titreChiffre" | "descriptionChiffree" | "lienChiffre" | "nomTableauChiffre" | "images">;

export type ChangementsSignalementEnBase = { statut?: StatutSignalementSecurite; gravite?: GraviteSignalementSecurite | null; clotureLe?: Date | null };

export type EntreeTableauEnBase = { id: number; nom: string; mois: string; signalementId: string | null; creeLe: Date };

export type LimiteDepotsEmail = { depuis: Date; maximum: number };

export type IssueAjoutSignalement = { ok: true } | { ok: false; depots: Date[] };

export type IssueBadgeEnBase = { ok: true; nouveau: boolean } | { ok: false; erreur: "signalement-inconnu" | "compte-introuvable" };

export type DepotSecurite = {
  listerDepotsEmail: (empreinte: string, depuis: Date) => Promise<Date[]>;
  ajouterSignalement: (signalement: SignalementEnBase, limite: LimiteDepotsEmail) => Promise<IssueAjoutSignalement>;
  listerSignalements: (filtres: { statut?: StatutSignalementSecurite }, nombre: number) => Promise<SignalementAvecTableau[]>;
  listerSignalementsApres: (apres: string | null, nombre: number) => Promise<SignalementEnBase[]>;
  lireSignalement: (id: string) => Promise<SignalementAvecTableau | null>;
  modifierSignalement: (id: string, changements: ChangementsSignalementEnBase) => Promise<boolean>;
  remplacerChiffres: (id: string, imagesAvant: readonly string[], chiffres: ChiffresSignalement) => Promise<boolean>;
  supprimerSignalement: (id: string) => Promise<{ images: string[] } | null>;
  effacerSignalementsClosAvant: (limite: Date) => Promise<{ nombre: number; images: string[] }>;
  listerImagesCitees: (fichiers: readonly string[]) => Promise<Set<string>>;
  listerEmailsConfirmes: (emails: readonly string[]) => Promise<Set<string>>;
  donnerBadge: (signalementId: string, email: string, badge: string, quand: Date) => Promise<IssueBadgeEnBase>;
  listerTableauHonneur: (nombre: number) => Promise<EntreeTableauEnBase[]>;
  ajouterAuTableau: (entree: { nom: string; mois: string; signalementId: string }, quand: Date) => Promise<void>;
  retirerDuTableauParSignalement: (signalementId: string) => Promise<boolean>;
  retirerEntreeTableau: (id: number) => Promise<boolean>;
};

export type DependancesSecurite = {
  depot: DepotSecurite;
  stockage: StockageMediasChat;
  chiffrement: ChiffrementSecurite | null;
  nettoyerJpeg: NettoyerJpeg;
  horloge?: () => number;
};

export type ErreurDepotSignalement =
  | "trop-d-images"
  | "image-trop-lourde"
  | "image-format"
  | "trop-de-demandes"
  | "chiffrement-indisponible"
  | "stockage-plein";

export type ResultatDepotSignalement =
  | { ok: true }
  | { ok: false; erreur: ErreurDepotSignalement; reessayerDans?: number }
  | { ok: false; erreur: "champ-invalide"; champ: string };

export type ResultatChangementSignalement =
  | { ok: true; signalement: SignalementSecuriteGestion }
  | { ok: false; erreur: "champ-invalide"; champ: string }
  | { ok: false; erreur: "signalement-inconnu" | "sans-nom-tableau" | "chiffrement-indisponible" };

export type ResultatBadgeSignalement =
  | { ok: true; nouveau: boolean }
  | { ok: false; erreur: "signalement-inconnu" | "compte-introuvable" | "chiffrement-indisponible" };

export type ImageSignalementLue = { octets: Buffer; typeMime: "image/png" | "image/jpeg" };

export type EntreeTableauHonneurGestion = EntreeTableauHonneur & { id: string; signalementId: string | null };

export type FiltresSignalementsSecurite = { statut?: StatutSignalementSecurite };

export type BilanMenageSecurite = {
  signalements: number;
  images: number;
  orphelines: number;
  rechiffres: number;
  illisibles: number;
};

export type ServicesSecuritePublics = {
  deposerSignalement: (signalement: NouveauSignalementSecurite, maintenant?: Date) => Promise<ResultatDepotSignalement>;
  listerTableauHonneur: () => Promise<EntreeTableauHonneur[]>;
};

export type ServicesSecuriteGestion = {
  listerSignalementsSecurite: (filtres?: FiltresSignalementsSecurite) => Promise<SignalementSecuriteGestion[]>;
  lireSignalementSecurite: (id: string) => Promise<SignalementSecuriteGestion | null>;
  changerSignalementSecurite: (id: string, changements: unknown, maintenant?: Date) => Promise<ResultatChangementSignalement>;
  lireImageSignalementSecurite: (id: string, numero: unknown) => Promise<ImageSignalementLue | null>;
  donnerBadgeSignalementSecurite: (id: string, maintenant?: Date) => Promise<ResultatBadgeSignalement>;
  supprimerSignalementSecurite: (id: string) => Promise<boolean>;
  listerEntreesTableauHonneur: () => Promise<EntreeTableauHonneurGestion[]>;
  retirerEntreeTableauHonneur: (id: string) => Promise<boolean>;
};
