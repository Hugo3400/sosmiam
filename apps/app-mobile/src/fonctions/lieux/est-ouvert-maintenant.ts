import type { Lieu } from "@sos-miam/commun/types/lieu";

const minutes = (heure: string) => {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
};

/** Vrai si le lieu est ouvert à ce moment, d'après ses créneaux ; un créneau qui finit avant de commencer passe minuit. */
export function estOuvertMaintenant(lieu: Lieu, maintenant: Date = new Date()): boolean {
  const jour = maintenant.getDay();
  const veille = (jour + 6) % 7;
  const instant = maintenant.getHours() * 60 + maintenant.getMinutes();
  return lieu.ouverture.some(({ jours, de, a }) => {
    const debut = minutes(de);
    const fin = minutes(a);
    if (fin > debut) return jours.includes(jour) && instant >= debut && instant < fin;
    // Passe minuit : ouvert ce soir après le début, ou cette nuit avant la fin (créneau commencé la veille)
    return (jours.includes(jour) && instant >= debut) || (jours.includes(veille) && instant < fin);
  });
}
