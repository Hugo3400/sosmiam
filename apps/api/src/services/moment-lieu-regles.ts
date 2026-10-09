// SOS « place ce soir » et message du moment d'un lieu (voir routes/comptoir.ts) : ce que les routes demandent aux données.
// Sans accès à la base : lu aussi par le double en mémoire (moment-lieu-en-memoire.ts). Prisma : moment-lieu.ts.
import type { CreneauOuverture } from "../../../../packages/commun/src/types/lieu.ts";

export type SosLigne = { places: number; offre: string | null; jusqua: Date; creeLe: Date; arreteLe: Date | null; lancePar: string | null };

export interface ServicesMomentLieu {
  /** Les horaires et le message du moment d'un lieu (null : lieu inconnu) */
  lireLieu(lieuId: number): Promise<{ ouverture: CreneauOuverture[]; alerte: string | null; alerteJusqua: Date | null } | null>;
  /** Le dernier SOS lancé depuis `depuis` (le début du jour de Paris), arrêté ou non */
  lireSosDepuis(lieuId: number, depuis: Date): Promise<SosLigne | null>;
  /** Lance le SOS, sous verrou du lieu ; « deja » si un SOS a déjà été lancé depuis `depuis` (un par jour) */
  lancerSos(lieuId: number, compteId: number, sos: { places: number; offre: string | null; jusqua: Date }, maintenant: Date, depuis: Date): Promise<"ok" | "deja">;
  /** Arrête le SOS en cours, s'il y en a un */
  arreterSos(lieuId: number, maintenant: Date): Promise<void>;
  /** Pose (ou efface, avec null) le message du moment */
  reglerMessage(lieuId: number, message: { texte: string; jusqua: Date } | null): Promise<void>;
}
