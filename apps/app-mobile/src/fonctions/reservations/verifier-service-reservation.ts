import type { PasCreneaux, ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { validerReglagesReservations } from "@sos-miam/commun/validation/valider-reglages-reservations";

import { lireNombreCouverts } from "~/fonctions/reservations/lire-nombre-couverts";
import { trouverChevauchementService } from "~/fonctions/reservations/trouver-chevauchement-service";

export type BrouillonService = { jours: number[]; premier: string; dernier: string; pas: PasCreneaux; couverts: string; arrivees: string | null };

export type ServiceVerifie =
  | { ok: true; service: ServiceReservation }
  | { ok: false; champ: "jours" | "premier" | "dernier" | "pas" | "couvertsParService" | "couvertsParCreneau" | "autre" }
  | { ok: false; champ: "chevauchement"; autre: ServiceReservation; jour: number };

const CHAMPS = new Set(["jours", "premier", "dernier", "pas", "couvertsParService", "couvertsParCreneau"]);

export function verifierServiceReservation(brouillon: BrouillonService, autres: readonly ServiceReservation[]): ServiceVerifie {
  const couvertsParService = lireNombreCouverts(brouillon.couverts) ?? Number.NaN;
  const couvertsParCreneau = brouillon.arrivees === null ? couvertsParService : (lireNombreCouverts(brouillon.arrivees) ?? Number.NaN);
  const candidat = { jours: brouillon.jours, premier: brouillon.premier, dernier: brouillon.dernier, pas: brouillon.pas, couvertsParService, couvertsParCreneau };
  const lu = validerReglagesReservations({ services: [candidat], acceptation: "manuelle", delai: "1-h" });
  if (!lu.ok) {
    const champ = lu.champ.replace(/^services\.0\.?/, "");
    return { ok: false, champ: CHAMPS.has(champ) ? (champ as "jours") : "autre" };
  }
  const service = lu.reglages.services[0]!;
  const chevauchement = trouverChevauchementService(service, autres);
  return chevauchement ? { ok: false, champ: "chevauchement", ...chevauchement } : { ok: true, service };
}
