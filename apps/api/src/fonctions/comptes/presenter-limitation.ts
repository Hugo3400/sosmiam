import { estLimitationActive, type LimitationLue } from "../../services/limitations-comptes-regles.ts";

/** La limitation telle que la personne la voit (GET /comptes/moi/limitation, contrat de routes/comptes.ts) */
export type LimitationVue = {
  /** Un code de MOTIFS_MODERATION (packages/commun) : le site et l'app l'écrivent en clair */
  motif: string;
  motivation: string;
  /** Dates en ISO 8601 ; fin null : jusqu'à nouvel ordre */
  debut: string;
  fin: string | null;
  contestation: string | null;
  contesteLe: string | null;
  reexamineLe: string | null;
  /** Vraie si elle court maintenant (fausse : elle commence plus tard) */
  active: boolean;
  /** Vraie si elle court et n'a pas encore été contestée (une seule contestation, pendant la limitation) */
  peutContester: boolean;
};

const iso = (date: Date | null) => date?.toISOString() ?? null;

/** La limitation en cours ou à venir, pour la personne limitée : jamais d'id, ni rien sur l'équipe */
export function presenterLimitation(limitation: LimitationLue, maintenant: Date): LimitationVue {
  const active = estLimitationActive(limitation, maintenant);
  return {
    motif: limitation.motif, motivation: limitation.motivation, debut: limitation.debut.toISOString(), fin: iso(limitation.fin),
    contestation: limitation.contestation, contesteLe: iso(limitation.contesteLe), reexamineLe: iso(limitation.reexamineLe),
    active, peutContester: active && limitation.contestation === null,
  };
}
