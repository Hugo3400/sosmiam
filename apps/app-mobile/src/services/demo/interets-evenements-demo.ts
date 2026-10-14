// Les « Ça m'intéresse » de la démo : gardés en mémoire, sur les événements joués par lieu-pro-demo (rien ne part au serveur).
import type { ServiceInteretsEvenements } from "@sos-miam/commun/client-api/contrat-interets-evenements";
import type { MonInteretEvenement } from "@sos-miam/commun/types/evenement";

import { listerEvenementsPublicsDemo } from "./lieu-pro-demo";
import type { ContexteDemo } from "./types-demo";

const interets = new Map<number, boolean>();

/** Les « Ça m'intéresse » joués sur le téléphone : la prochaine date de chaque événement gardé, la plus proche d'abord */
export function creerInteretsEvenementsDemo(ctx: ContexteDemo): ServiceInteretsEvenements {
  const lister = (): MonInteretEvenement[] => {
    const vus = new Set<number>();
    return listerEvenementsPublicsDemo(null, ctx.maintenant())
      .filter((e) => interets.has(e.id) && !vus.has(e.id) && vus.add(e.id))
      .map((evenement) => ({ evenement, rappel: interets.get(evenement.id) ?? false, annule: false }));
  };
  return {
    listerMesInterets: async () => ({ ok: true, interets: lister() }),
    async poserInteret(id, rappel) {
      if (!listerEvenementsPublicsDemo(null, ctx.maintenant()).some((e) => e.id === id)) return { ok: false, erreur: "evenement-inconnu" };
      interets.set(id, rappel);
      return { ok: true, interets: lister() };
    },
    async retirerInteret(id) {
      interets.delete(id);
      return { ok: true, interets: lister() };
    },
  };
}
