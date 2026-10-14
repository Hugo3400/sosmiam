import type { ListePartagee } from "@sos-miam/commun/types/potes";

/** Vrai si tu suis cette liste (démo : tu es dans ses abonnés ; compte connecté : le serveur le dit) */
export function estListeSuivie(liste: ListePartagee, monId: string): boolean {
  return liste.serveur ? liste.serveur.moi.abonne : liste.abonnes.includes(monId);
}
