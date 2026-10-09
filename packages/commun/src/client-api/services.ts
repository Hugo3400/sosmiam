// L'ensemble des services utilisés par l'app (et plus tard le site) : démo locale, API, ou indisponibles.

import type { ServiceAvis } from "./contrat-avis.ts";
import type { ServiceComptoir } from "./contrat-comptoir.ts";
import type { ServiceEspaceAmbassadeur } from "./contrat-espace-ambassadeur.ts";
import type { ServiceFidelite } from "./contrat-fidelite.ts";
import type { ServiceReservations } from "./contrat-reservations.ts";
import type { ServiceSuggestions } from "./contrat-suggestions.ts";
import type { ServiceVisites } from "./contrat-visites.ts";

export type SourceServices = "demo" | "api" | "indisponible";

export type Services = {
  source: SourceServices;
  visites: ServiceVisites;
  fidelite: ServiceFidelite;
  reservations: ServiceReservations;
  avis: ServiceAvis;
  comptoir: ServiceComptoir;
  ambassadeur: ServiceEspaceAmbassadeur;
  suggestions: ServiceSuggestions;
};
