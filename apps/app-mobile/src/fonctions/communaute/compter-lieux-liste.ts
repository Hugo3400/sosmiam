import type { ListePartagee } from "@sos-miam/commun/types/potes";

/** Combien de lieux dans une liste : ceux qu'on a, ou le nombre donné par le serveur tant qu'elle n'est lue qu'en résumé */
export function compterLieuxListe(liste: ListePartagee): number {
  return liste.serveur && !liste.serveur.complete ? liste.serveur.nombreLieux : liste.lieux.length;
}
