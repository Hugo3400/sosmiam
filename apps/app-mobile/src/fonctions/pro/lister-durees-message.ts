import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import type { ChoixFin } from "~/fonctions/pro/lister-fins-ce-soir";

const HEURE_MS = 60 * 60_000;

/** Combien de temps garder le message du moment : jusqu'à la fermeture (si on la connaît), 1 h, 3 h ou 24 h (le maximum). */
export function listerDureesMessage(maintenant: Date, fermeture: string | null): ChoixFin[] {
  const dans = (heures: number, marge = 0) => new Date(maintenant.getTime() + heures * HEURE_MS - marge).toISOString();
  return [
    ...(fermeture ? [{ cle: "fermeture", libelle: `Jusqu'à la fermeture (${ecrireHeure(fermeture)})`, jusqua: null }] : []),
    { cle: "1h", libelle: "Pendant 1 h", jusqua: dans(1) },
    { cle: "3h", libelle: "Pendant 3 h", jusqua: dans(3) },
    // Une minute de marge : 24 h est le maximum permis par le serveur
    { cle: "24h", libelle: "Pendant 24 h", jusqua: dans(24, 60_000) },
  ];
}
