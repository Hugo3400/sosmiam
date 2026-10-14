import type { ListePartagee } from "@sos-miam/commun/types/potes";

/** Vrai si tu peux ajouter ou retirer des lieux dans cette liste : tu en es l'auteur, ou un co-auteur qui a accepté */
export function peutRemplirListe(liste: ListePartagee, monId: string): boolean {
  if (liste.serveur) return liste.serveur.moi.peutRemplir;
  return liste.auteur === monId || (liste.coAuteurs ?? []).some((c) => c.id === monId && c.statut === "accepte");
}
