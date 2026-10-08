import type { CreneauOuverture } from "../../types/lieu.ts";
import { DELAI_MIN_RESERVATION_MS, JOURS_RESERVATION_MAX, PAS_CRENEAUX_MIN } from "../../regles/reservations.ts";
import { calculerDecalageParis } from "../temps/calculer-decalage-paris.ts";
import { calculerInstantParis } from "../temps/calculer-instant-paris.ts";

const JOUR_MS = 24 * 60 * 60_000;
const MINUIT = 24 * 60;

/** « HH:MM » en minutes depuis minuit ; null si l'heure est mal écrite. */
function lireMinutes(heure: string): number | null {
  const morceaux = /^(\d{2}):(\d{2})$/.exec(heure);
  if (!morceaux) return null;
  const [heures, minutes] = [Number(morceaux[1]), Number(morceaux[2])];
  return heures > 24 || minutes > 59 ? null : heures * 60 + minutes;
}

const ecrireHeure = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * Les créneaux réservables d'un jour « AAAA-MM-JJ » (heure de Paris), triés : « HH:MM » toutes les 30 min, dans les
 * horaires d'ouverture (de l'ouverture jusqu'à la dernière demi-heure avant la fermeture), au moins 30 min après
 * maintenant, et seulement d'aujourd'hui à dans 30 jours. Un créneau d'ouverture qui passe minuit s'arrête à 23 h 30
 * ce jour-là (pas de réservation après minuit). Jour mal écrit, passé ou trop lointain : aucun créneau.
 */
export function listerCreneauxReservation(ouverture: readonly CreneauOuverture[], jour: string, maintenant: Date): string[] {
  const maintenantMs = maintenant.getTime();
  const debutJourMs = calculerInstantParis(jour, "00:00");
  if (Number.isNaN(maintenantMs) || Number.isNaN(debutJourMs)) return [];

  // Écart en jours avec aujourd'hui, les deux dates lues à l'heure de Paris
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const jourUtc = Date.UTC(annee, mois - 1, quantieme);
  const aujourdhuiParis = new Date(maintenantMs + calculerDecalageParis(maintenantMs));
  const aujourdhuiUtc = Date.UTC(aujourdhuiParis.getUTCFullYear(), aujourdhuiParis.getUTCMonth(), aujourdhuiParis.getUTCDate());
  const ecartJours = Math.round((jourUtc - aujourdhuiUtc) / JOUR_MS);
  if (ecartJours < 0 || ecartJours > JOURS_RESERVATION_MAX) return [];

  const jourSemaine = new Date(jourUtc).getUTCDay();
  const minutes = new Set<number>();
  for (const creneau of ouverture) {
    if (!creneau.jours.includes(jourSemaine)) continue;
    const debut = lireMinutes(creneau.de);
    const fin = lireMinutes(creneau.a);
    if (debut === null || fin === null || debut >= MINUIT) continue;
    // Une fin avant (ou égale à) l'ouverture passe minuit : ce jour-là, on s'arrête à minuit
    const finCeJour = fin > debut ? Math.min(fin, MINUIT) : MINUIT;
    for (let t = Math.ceil(debut / PAS_CRENEAUX_MIN) * PAS_CRENEAUX_MIN; t < finCeJour; t += PAS_CRENEAUX_MIN) minutes.add(t);
  }

  return [...minutes]
    .sort((a, b) => a - b)
    .map(ecrireHeure)
    .filter((heure) => calculerInstantParis(jour, heure) - maintenantMs >= DELAI_MIN_RESERVATION_MS);
}
