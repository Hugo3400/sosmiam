import { FENETRE_RELANCE_QR, REMISES_MAX_QR, type StatutQr } from "../../services/connexion-qr-regles.ts";

/** Ce qu'il faut savoir d'une demande pour lui remettre une session (remisLe et nombreRemises : vides avant la première) */
export type EtatRemiseQr = { statut: StatutQr; remisLe: number | null; nombreRemises: number | null };

/**
 * « premiere » : la demande vient d'être acceptée ; « relance » : la session a déjà été remise, il y a 30 s au plus (depuis la
 * PREMIÈRE remise) et moins de 3 fois : la réponse s'est sans doute perdue ; null : plus rien à remettre. Une demande remise
 * avant les colonnes de relance (remisLe vide) ne se relance pas.
 */
export function choisirRemiseQr({ statut, remisLe, nombreRemises }: EtatRemiseQr, maintenant: number): "premiere" | "relance" | null {
  if (statut === "accepte") return "premiere";
  if (statut !== "utilisee" || remisLe === null || nombreRemises === null) return null;
  return maintenant - remisLe <= FENETRE_RELANCE_QR && nombreRemises < REMISES_MAX_QR ? "relance" : null;
}
