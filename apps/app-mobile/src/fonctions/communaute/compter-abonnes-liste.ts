import type { ListePartagee } from "@sos-miam/commun/types/potes";

/** Combien de personnes suivent une liste (compte connecté : le nombre du serveur ; sinon : ses abonnés connus) */
export function compterAbonnesListe(liste: ListePartagee): number {
  return liste.serveur ? liste.serveur.nombreAbonnes : liste.abonnes.length;
}
