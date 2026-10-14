import type { ActiviteApi } from "../../types/activite.ts";
import type { GesteActiviteEnAttente } from "../../types/geste-activite.ts";
import { appliquerGesteActivite } from "./appliquer-geste-activite.ts";

/** Ce que vise le geste : « jaime:34 », « garde:12 », « suivi:createur:lea.mange »… */
function lireCible(geste: GesteActiviteEnAttente): string {
  if (geste.quoi === "jaime" || geste.quoi === "masque") return `${geste.quoi}:${geste.publicationId}`;
  if (geste.quoi === "suivi") return `suivi:${geste.cle}`;
  return `${geste.quoi}:${geste.lieuId}`;
}

/**
 * Ajoute un geste à la file de ceux qui ne sont pas encore partis vers l'API. Un geste sur la même cible remplace celui
 * qui attendait encore (deux appuis sur le même J'aime : seul le dernier compte) ; s'il revient à ce que l'API aura déjà
 * (`base` : sa dernière réponse, plus le geste en route s'il y en a un), les deux disparaissent. L'ordre des autres
 * gestes ne change pas, et la file reçue n'est jamais modifiée.
 */
export function ajouterGesteEnAttente(file: readonly GesteActiviteEnAttente[], geste: GesteActiviteEnAttente, base: ActiviteApi): GesteActiviteEnAttente[] {
  const cible = lireCible(geste);
  const autres = file.filter((g) => lireCible(g) !== cible);
  return appliquerGesteActivite(base, geste) === base ? autres : [...autres, geste];
}
