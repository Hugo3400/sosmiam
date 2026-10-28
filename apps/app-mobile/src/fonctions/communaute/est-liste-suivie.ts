import type { ListePartagee } from "@sos-miam/commun/types/potes";

/** Vrai si tu suis cette liste (compte connecté : le serveur le dit ; sinon : tu es dans ses abonnés) */
export function estListeSuivie(liste: ListePartagee, monId: string): boolean {
  return liste.serveur ? liste.serveur.moi.abonne : liste.abonnes.includes(monId);
}
