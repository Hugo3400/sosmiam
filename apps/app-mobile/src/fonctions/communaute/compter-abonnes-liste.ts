import type { ListePartagee } from "@sos-miam/commun/types/potes";

/** Combien de personnes suivent une liste (démo : ses abonnés connus ; compte connecté : le nombre du serveur) */
export function compterAbonnesListe(liste: ListePartagee): number {
  return liste.serveur ? liste.serveur.nombreAbonnes : liste.abonnes.length;
}
