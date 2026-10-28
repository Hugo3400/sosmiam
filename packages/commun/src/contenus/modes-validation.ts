// Comment une visite a été validée, tel qu'on l'affiche (« Mes visites », preuve d'un avis, validations du comptoir).

import type { ParLangue, Traduction } from "../types/traduction.ts";
import type { ModeValidation } from "../types/visite.ts";
import { LIBELLES_MODE_VALIDATION_ANGLAIS } from "./anglais/modes-validation.ts";

export const LIBELLES_MODE_VALIDATION: Readonly<Record<ModeValidation, string>> = {
  addition: "Addition réglée",
  comptoir: "QR du comptoir",
  reservation: "Réservation honorée",
};

export const LIBELLES_MODE_VALIDATION_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_MODE_VALIDATION>> = { fr: LIBELLES_MODE_VALIDATION, en: LIBELLES_MODE_VALIDATION_ANGLAIS };
