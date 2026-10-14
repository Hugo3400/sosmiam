import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";

export type ChoixFin = { cle: string; libelle: string; /** null : jusqu'à la fermeture de ce soir */ jusqua: string | null };

const HEURE_MS = 60 * 60_000;

/**
 * Jusqu'à quand un SOS peut tenir ce soir : « À la fermeture (23h) » si les horaires la donnent, puis des heures pile d'ici
 * là (4 au plus) ; sans fermeture connue, des heures pile jusqu'à 4 h du matin (6 au plus), car il faut alors le dire.
 * La première heure laisse au moins 30 minutes.
 */
export function listerFinsCeSoir(maintenant: Date, fermeture: string | null): ChoixFin[] {
  const debut = new Date(maintenant.getTime() + 30 * 60_000);
  debut.setMinutes(0, 0, 0);
  if (debut.getTime() <= maintenant.getTime() + 30 * 60_000) debut.setTime(debut.getTime() + HEURE_MS);
  const choix: ChoixFin[] = [];
  if (fermeture) {
    choix.push({ cle: "fermeture", libelle: `À la fermeture (${ecrireHeure(fermeture)})`, jusqua: null });
    for (let t = debut.getTime(); t < Date.parse(fermeture) && choix.length < 5; t += HEURE_MS) {
      choix.push({ cle: String(t), libelle: `Jusqu'à ${ecrireHeure(new Date(t))}`, jusqua: new Date(t).toISOString() });
    }
    return choix;
  }
  const limite = new Date(maintenant);
  limite.setHours(4, 0, 0, 0);
  if (limite.getTime() <= maintenant.getTime()) limite.setDate(limite.getDate() + 1);
  for (let t = debut.getTime(); t <= limite.getTime() && choix.length < 6; t += HEURE_MS) {
    choix.push({ cle: String(t), libelle: `Jusqu'à ${ecrireHeure(new Date(t))}`, jusqua: new Date(t).toISOString() });
  }
  return choix;
}
