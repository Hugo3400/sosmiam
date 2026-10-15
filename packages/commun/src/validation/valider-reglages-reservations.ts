import {
  COUVERTS_PAR_SERVICE_MAX, DELAIS_RESERVATION, FIN_SERVICE_MAX_MIN, MODES_ACCEPTATION_RESERVATION, PAS_CRENEAUX_POSSIBLES,
  SERVICES_RESERVATION_MAX,
} from "../regles/reglages-reservations.ts";
import type {
  DelaiReservation, ModeAcceptationReservation, PasCreneaux, ReglagesServicesReservations, ServiceReservation,
} from "../types/reglages-reservations.ts";

export type ResultatReglagesReservations = { ok: true; reglages: ReglagesServicesReservations } | { ok: false; champ: string };

const HEURE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const estEntier = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

function lireMinutes(v: unknown): number | null {
  const morceaux = typeof v === "string" ? HEURE.exec(v) : null;
  return morceaux ? Number(morceaux[1]) * 60 + Number(morceaux[2]) : null;
}

type ServiceLu = { service: ServiceReservation; debut: number; fin: number };

function lireService(brut: unknown, champ: string): ServiceLu | string {
  if (typeof brut !== "object" || brut === null) return champ;
  const s = brut as Record<string, unknown>;
  if (!Array.isArray(s.jours) || s.jours.length === 0 || !s.jours.every((j) => estEntier(j, 0, 6))) return `${champ}.jours`;
  if (!PAS_CRENEAUX_POSSIBLES.includes(s.pas as PasCreneaux)) return `${champ}.pas`;
  const pas = s.pas as PasCreneaux;
  const premier = lireMinutes(s.premier);
  if (premier === null || premier % 15 !== 0) return `${champ}.premier`;
  const dernier = lireMinutes(s.dernier);
  if (dernier === null || dernier < premier || (dernier - premier) % pas !== 0 || dernier + pas > FIN_SERVICE_MAX_MIN) return `${champ}.dernier`;
  if (!estEntier(s.couvertsParService, 1, COUVERTS_PAR_SERVICE_MAX)) return `${champ}.couvertsParService`;
  const couvertsParService = s.couvertsParService;
  const parCreneau = s.couvertsParCreneau ?? couvertsParService;
  if (!estEntier(parCreneau, 1, couvertsParService)) return `${champ}.couvertsParCreneau`;
  const jours = [...new Set(s.jours as number[])].sort((a, b) => a - b);
  return {
    service: { jours, premier: s.premier as string, dernier: s.dernier as string, pas, couvertsParService, couvertsParCreneau: parCreneau },
    debut: premier,
    fin: dernier + pas,
  };
}

export function validerReglagesReservations(brut: unknown): ResultatReglagesReservations {
  if (typeof brut !== "object" || brut === null) return { ok: false, champ: "reglages" };
  const r = brut as Record<string, unknown>;
  if (!Array.isArray(r.services) || r.services.length > SERVICES_RESERVATION_MAX) return { ok: false, champ: "services" };
  const lus: ServiceLu[] = [];
  for (const [i, s] of r.services.entries()) {
    const lu = lireService(s, `services.${i}`);
    if (typeof lu === "string") return { ok: false, champ: lu };
    const chevauche = lus.some((autre) => autre.service.jours.some((j) => lu.service.jours.includes(j)) && lu.debut < autre.fin && autre.debut < lu.fin);
    if (chevauche) return { ok: false, champ: `services.${i}.premier` };
    lus.push(lu);
  }
  if (!MODES_ACCEPTATION_RESERVATION.includes(r.acceptation as ModeAcceptationReservation)) return { ok: false, champ: "acceptation" };
  const acceptation = r.acceptation as ModeAcceptationReservation;
  if (acceptation === "automatique" && lus.length === 0) return { ok: false, champ: "acceptation" };
  if (!DELAIS_RESERVATION.includes(r.delai as DelaiReservation)) return { ok: false, champ: "delai" };
  return { ok: true, reglages: { services: lus.map((l) => l.service), acceptation, delai: r.delai as DelaiReservation } };
}
