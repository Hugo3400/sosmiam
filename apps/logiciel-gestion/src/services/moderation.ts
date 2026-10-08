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
  /** Raison grave : la publication a été masquée pour tous dès ce signalement */
  urgent: boolean;
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

export type FileModeration = { compteurs: Partial<Record<VueModeration, number>>; signalements: Signalement[] };

export const listerSignalements = (statut: VueModeration | "") => appeler<FileModeration>("GET", `/moderation${parametres({ statut })}`);
/** Retenu : la règle enfreinte (motif) et l'explication pour l'auteur (motivation) sont obligatoires */
export const deciderSignalement = (id: number, choix: { decision: "retenu" | "rejete"; note: string; motif: string | null; motivation: string | null }) =>
  appeler<{ ok: true; regles: number; reexamen: boolean }>("POST", `/moderation/${id}/decision`, { corps: choix });
/** Une contestation reçue par mail : la décision part dans « Contestés » pour être réexaminée */
export const contesterSignalement = (id: number, contestation: string) => appeler<{ ok: true }>("POST", `/moderation/${id}/contestation`, { corps: { contestation } });
