import type { EtatServeur } from "~/services/maintenance.ts";

/** Programmes qui doivent toujours tourner (les serveurs de développement et l'aperçu ne comptent pas) */
const PROGRAMMES_ESSENTIELS = ["sos-miam-api", "sos-miam-site", "sos-miam-bot-discord"];
const DISQUE_PLEIN = 0.9;
const SAUVEGARDE_TROP_VIEILLE = 30 * 3600_000;

/** Ce qui ne va pas sur le serveur, en phrases courtes (vide si tout va bien). */
export function trouverProblemes(etat: EtatServeur, maintenant = Date.now()): string[] {
  const problemes: string[] = [];
  if (!etat.base.enLigne) problemes.push("La base de données ne répond pas.");
  if (!etat.site.enLigne) problemes.push("Le site ne répond pas.");
  for (const nom of PROGRAMMES_ESSENTIELS) {
    const programme = etat.processus?.find((p) => p.nom === nom);
    if (etat.processus && programme?.statut !== "online") problemes.push(`Le programme ${nom} est arrêté.`);
  }
  if (etat.disque && 1 - etat.disque.libre / etat.disque.total >= DISQUE_PLEIN) {
    problemes.push(`Le disque du serveur est plein à ${Math.round((1 - etat.disque.libre / etat.disque.total) * 100)} %.`);
  }
  const derniere = etat.sauvegardes.derniere;
  if (!derniere) problemes.push("Aucune sauvegarde de la base pour l'instant.");
  else if (maintenant - new Date(derniere.creeLe).getTime() > SAUVEGARDE_TROP_VIEILLE) problemes.push("La dernière sauvegarde de la base date de plus de 30 heures.");
  return problemes;
}
