// Limitation d'un compte, vue par la personne concernée (GET /comptes/moi/limitation, contrat dans
// apps/api/src/routes/comptes.ts). Décidé par Hugo le 15 octobre 2026 : coupe seulement ce que les autres voient.

/** La limitation en cours (active) ou à venir ; dates en ISO. `fin` null : jusqu'à nouvel ordre. */
export type LimitationCompteApi = {
  /** Code de MOTIFS_MODERATION (contenus/motifs-moderation.ts) */
  motif: string;
  /** Le pourquoi, écrit par l'équipe pour la personne */
  motivation: string;
  debut: string;
  fin: string | null;
  contestation: string | null;
  contesteLe: string | null;
  reexamineLe: string | null;
  /** Vrai si elle est en cours (faux : elle commence plus tard) */
  active: boolean;
  /** Vrai si elle est en cours et pas encore contestée (une seule contestation) */
  peutContester: boolean;
};
