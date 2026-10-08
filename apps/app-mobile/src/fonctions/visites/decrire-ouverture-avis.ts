import { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { Visite } from "@sos-miam/commun/types/visite";

const NOMS_DES_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 21 h 47 », « 22 h » (heure du téléphone, c'est-à-dire celle du lieu où l'on vient de manger) */
function formaterHeureAvis(date: Date): string {
  const minutes = date.getMinutes();
  return minutes === 0 ? `${date.getHours()} h` : `${date.getHours()} h ${String(minutes).padStart(2, "0")}`;
}

/** « 1 minute », « 45 minutes », « 1 heure » : arrondi à la minute du dessus, pour ne jamais annoncer trop tôt */
function formaterAttente(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `${heures} heure${heures > 1 ? "s" : ""}` : `${heures} h ${String(reste).padStart(2, "0")}`;
}

/** « 23 octobre », « 1er novembre » */
function formaterJour(date: Date): string {
  const jour = date.getDate();
  return `${jour === 1 ? "1er" : jour} ${NOMS_DES_MOIS[date.getMonth()]}`;
}

/**
 * Quand s'ouvre l'avis d'une visite validée, en une phrase : « Ton avis s'ouvre à 21 h 47, dans 1 heure. Pas devant le patron. »
 * Déjà ouvert : jusqu'à quand on peut le donner. null s'il n'y a rien à dire (pas d'avis, déjà donné, ou fermé).
 */
export function decrireOuvertureAvis(avis: Visite["avis"], maintenant: Date = new Date()): string | null {
  const etat = decrireEtatAvis(avis, maintenant.getTime());
  if (!avis || etat === "aucun" || etat === "donne" || etat === "ferme") return null;
  if (etat === "ouvert") return `Ton avis t'attend : tu as jusqu'au ${formaterJour(new Date(avis.fermeLe))} pour le donner, à tête reposée.`;
  const ouvertLe = new Date(avis.ouvertLe);
  return `Ton avis s'ouvre à ${formaterHeureAvis(ouvertLe)}, dans ${formaterAttente(ouvertLe.getTime() - maintenant.getTime())}. Pas devant le patron.`;
}
