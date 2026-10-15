import { useSyncExternalStore } from "react";

import { renvoiChoixOffres } from "~/services/renvoi-choix-offres";

export function utiliserChoixOffresEnAttente(): boolean {
  return useSyncExternalStore(renvoiChoixOffres.abonner, renvoiChoixOffres.lireEnAttente, renvoiChoixOffres.lireEnAttente);
}
