import { appeler } from "./client-gestion.ts";

/** Le rayon par défaut et ses bornes (packages/commun/src/regles/visites.ts) */
export const RAYON_VALIDATION = { defaut: 200, min: 100, max: 500 } as const;

export type ReglageValidation = { codePublic: string; validationActive: boolean; rayonM: number | null; modifieLe: string };

/** La validation d'un lieu (null : jamais réglée) et ce qui l'empêcherait de marcher */
export type ValidationLieu = { validation: ReglageValidation | null; publie: boolean; positionConnue: boolean; comptesPro: number };

/** Le lien du QR de vitrine (même forme que construireLienLieu de packages/commun) */
export const construireLienVitrine = (codePublic: string) => `https://sosmiam.fr/l/${codePublic}`;

export const lireValidationLieu = (lieuId: number) => appeler<ValidationLieu>("GET", `/lieux/${lieuId}/validation`);
export const reglerValidationLieu = (lieuId: number, reglage: { validationActive: boolean; rayonM: number | null }) =>
  appeler<{ ok: true; validation: ReglageValidation }>("PUT", `/lieux/${lieuId}/validation`, { corps: reglage });
/** Un nouveau code : l'ancien QR de vitrine ne mène plus nulle part */
export const changerCodeVitrine = (lieuId: number) => appeler<{ ok: true; validation: ReglageValidation }>("POST", `/lieux/${lieuId}/validation/code`);
