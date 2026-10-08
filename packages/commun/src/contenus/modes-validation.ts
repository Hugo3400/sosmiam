// Comment une visite a été validée, tel qu'on l'affiche (« Mes visites », preuve d'un avis, validations du comptoir).

import type { ModeValidation } from "../types/visite.ts";

export const LIBELLES_MODE_VALIDATION: Readonly<Record<ModeValidation, string>> = {
  addition: "Addition réglée",
  comptoir: "QR du comptoir",
  reservation: "Réservation honorée",
};
