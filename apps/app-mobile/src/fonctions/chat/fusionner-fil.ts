import type { MessageChat } from "@sos-miam/commun/types/conversations";

/**
 * Les messages d'un fil après une relecture : la page relue (les 50 derniers, du plus ancien au plus récent) remplace ce
 * qu'on avait sur sa période, et les messages plus anciens déjà chargés (« Voir les messages d'avant ») restent devant.
 * plusAnciens : une page chargée par « avant », à mettre devant tout le reste.
 */
export function fusionnerFil<M extends MessageChat>(deja: readonly M[], page: readonly M[], plusAnciens = false): M[] {
  if (plusAnciens) {
    const connus = new Set(deja.map((m) => m.id));
    return [...page.filter((m) => !connus.has(m.id)), ...deja];
  }
  if (page.length === 0) return [...page];
  const debut = page[0]!.date;
  const ids = new Set(page.map((m) => m.id));
  const avant = deja.filter((m) => !ids.has(m.id) && m.date < debut);
  return [...avant, ...page];
}
