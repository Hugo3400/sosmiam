import type { CreneauOuverture } from "../../types/lieu.ts";
import { calculerDecalageParis } from "../temps/calculer-decalage-paris.ts";
import { calculerInstantParis } from "../temps/calculer-instant-paris.ts";

const JOUR_MS = 24 * 60 * 60_000;

/** « HH:MM » en minutes depuis minuit (24:00 permis) ; null si l'heure est mal écrite. */
function lireMinutes(heure: string): number | null {
  const morceaux = /^(\d{2}):(\d{2})$/.exec(heure);
  if (!morceaux) return null;
  const [heures, minutes] = [Number(morceaux[1]), Number(morceaux[2])];
  return heures > 24 || minutes > 59 || (heures === 24 && minutes > 0) ? null : heures * 60 + minutes;
}

/** Le jour « AAAA-MM-JJ » de Paris d'un instant, et son jour de la semaine (0 = dimanche) */
function lireJourParis(instantMs: number): { jour: string; semaine: number } {
  const paris = new Date(instantMs + calculerDecalageParis(instantMs));
  const jour = `${paris.getUTCFullYear()}-${String(paris.getUTCMonth() + 1).padStart(2, "0")}-${String(paris.getUTCDate()).padStart(2, "0")}`;
  return { jour, semaine: paris.getUTCDay() };
}

/**
 * L'heure de fermeture « de ce soir » d'un lieu, d'après ses horaires (heure de Paris) : la fin du créneau en cours s'il est
 * ouvert (un créneau de la veille qui passe minuit compte), sinon la fin du prochain créneau qui commence plus tard aujourd'hui.
 * null : pas d'horaires, ou plus d'ouverture prévue aujourd'hui. Sert au SOS « place ce soir » (jusqu'à la fermeture).
 */
export function calculerFermetureDuJour(ouverture: readonly CreneauOuverture[], maintenant: Date): Date | null {
  const maintenantMs = maintenant.getTime();
  if (Number.isNaN(maintenantMs)) return null;
  const aujourdhui = lireJourParis(maintenantMs);
  const hier = lireJourParis(maintenantMs - JOUR_MS);
  const demain = lireJourParis(maintenantMs + JOUR_MS);

  const intervalles: { debut: number; fin: number }[] = [];
  for (const creneau of ouverture) {
    const de = lireMinutes(creneau.de);
    const a = lireMinutes(creneau.a);
    if (de === null || a === null) continue;
    const ecrire = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    // Une fin avant (ou égale à) l'ouverture passe minuit ; « 24:00 », c'est minuit pile
    const passeMinuit = a <= de || a === 24 * 60;
    if (creneau.jours.includes(aujourdhui.semaine)) {
      intervalles.push({
        debut: calculerInstantParis(aujourdhui.jour, ecrire(de)),
        fin: calculerInstantParis(passeMinuit ? demain.jour : aujourdhui.jour, ecrire(a)),
      });
    }
    // Le créneau d'hier soir qui n'est pas encore fini
    if (passeMinuit && creneau.jours.includes(hier.semaine)) {
      intervalles.push({ debut: calculerInstantParis(hier.jour, ecrire(de)), fin: calculerInstantParis(aujourdhui.jour, ecrire(a)) });
    }
  }
  const valables = intervalles.filter((i) => !Number.isNaN(i.debut) && !Number.isNaN(i.fin) && i.fin > maintenantMs);
  const enCours = valables.filter((i) => i.debut <= maintenantMs).sort((x, y) => y.fin - x.fin)[0];
  if (enCours) return new Date(enCours.fin);
  const prochain = valables.filter((i) => lireJourParis(i.debut).jour === aujourdhui.jour).sort((x, y) => x.debut - y.debut)[0];
  return prochain ? new Date(prochain.fin) : null;
}
