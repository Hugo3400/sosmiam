import { appeler, parametres } from "./client-gestion.ts";
import type { Media } from "./publications.ts";

export type StatutSignalement = "a-traiter" | "retenu" | "rejete";
/** Les onglets de la file : les statuts, plus « conteste » (décision contestée, à réexaminer) */
export type VueModeration = StatutSignalement | "conteste";

export type Signalement = {
  id: number;
  cible: string;
  cibleId: string;
  lieuId: number | null;
  raison: string;
  precision: string | null;
  explication: string;
  source: string;
  statut: StatutSignalement;
  decision: string | null;
  /** Règle enfreinte (signalement retenu) et explication pour l'auteur */
  motif: string | null;
  motivation: string | null;
  contestation: string | null;
  contesteLe: string | null;
  reexamineLe: string | null;
  creeLe: string;
  traiteLe: string | null;
  /** Raison grave : le contenu a été masqué pour tous dès ce signalement */
  urgent: boolean;
  /** Qui a signalé et qui a écrit le contenu (comptes) ; null : inconnu ou compte supprimé */
  signaleParId?: number | null;
  auteurContenuId?: number | null;
  /** Contenu social : son instantané au moment du signalement, déchiffré (jamais le contenu vivant) */
  instantane?: { etat: "lu"; contenu: Record<string, unknown> } | { etat: "illisible" | "sans-cle" } | null;
  /** Une photo ou une note vocale signalée, lisible tant que le signalement n'est pas jugé */
  avecMedia?: boolean;
  /** Signalements abusifs : son taux de rejet sur 12 mois (sur ceux jugés) et ses signalements du mois */
  signaleur?: { juges: number; rejetes: number; partRejets: number | null; ceMois: number } | null;
  publication: {
    id: number;
    legende: string;
    statut: string;
    suspendue: boolean;
    auteurType: string;
    auteurPseudo: string | null;
    partenariat: string | null;
    lieu: { nom: string; emoji: string };
    medias: Pick<Media, "id" | "type" | "fichier">[];
  } | null;
};

export type LieuCite = { id: number; nom: string; emoji: string; ville: string };
export type FileModeration = { compteurs: Partial<Record<VueModeration, number>>; signalements: Signalement[]; lieux?: Record<string, LieuCite> };

/** cible : « publication », « commentaire », « message », « liste », « profil », « sortie », « groupe », ou "" pour tout */
export const listerSignalements = (statut: VueModeration | "", cible = "") => appeler<FileModeration>("GET", `/moderation${parametres({ statut, cible })}`);
/** La photo ou la note vocale d'un message signalé (lu noté au journal) */
export const lireMediaSignale = (id: number) => appeler<Blob>("GET", `/moderation/${id}/media`, { reponse: "blob" });
/** Retenu : la règle enfreinte (motif) et l'explication pour l'auteur (motivation) sont obligatoires */
export const deciderSignalement = (id: number, choix: { decision: "retenu" | "rejete"; note: string; motif: string | null; motivation: string | null }) =>
  appeler<{ ok: true; regles: number; reexamen: boolean }>("POST", `/moderation/${id}/decision`, { corps: choix });
/** Une contestation reçue par mail : la décision part dans « Contestés » pour être réexaminée */
export const contesterSignalement = (id: number, contestation: string) => appeler<{ ok: true }>("POST", `/moderation/${id}/contestation`, { corps: { contestation } });
