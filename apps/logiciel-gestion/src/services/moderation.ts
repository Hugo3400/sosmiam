import { appeler, parametres } from "./client-gestion.ts";
import type { Media } from "./publications.ts";

export type StatutSignalement = "a-traiter" | "retenu" | "rejete";

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

export type FileModeration = { compteurs: Partial<Record<StatutSignalement, number>>; signalements: Signalement[] };

export const listerSignalements = (statut: StatutSignalement | "") => appeler<FileModeration>("GET", `/moderation${parametres({ statut })}`);
export const deciderSignalement = (id: number, decision: "retenu" | "rejete", note: string) =>
  appeler<{ ok: true; regles: number }>("POST", `/moderation/${id}/decision`, { corps: { decision, note } });
