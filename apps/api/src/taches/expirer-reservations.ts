import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { brancherReponsesReservations, type PrevenirCompte } from "../services/reponses-reservations.ts";
import type { DepotVisites } from "../services/visites-regles.ts";

export const INTERVALLE_EXPIRATION_RESERVATIONS_MS = 60_000;

export type DependancesExpirationReservations = {
  depot: DepotVisites;
  prevenirCompte: PrevenirCompte;
  horloge?: () => number;
  intervalleMs?: number;
};

export function creerPassageExpirationReservations(d: Omit<DependancesExpirationReservations, "intervalleMs">): () => Promise<number> {
  const horloge = d.horloge ?? Date.now;
  const { depot } = brancherReponsesReservations(d, horloge);
  return async () => {
    try {
      const expirees = await depot.ecrire((t) => t.expirerReservations(new Date(horloge())));
      if (expirees.length > 0) console.log(`Réservations : ${expirees.length} demande(s) sans réponse endormie(s).`);
      return expirees.length;
    } catch (erreur) {
      console.error("Expiration des réservations :", resumerErreur(erreur));
      return 0;
    }
  };
}

export function planifierExpirationReservations(d: DependancesExpirationReservations): () => void {
  const passer = creerPassageExpirationReservations(d);
  let enCours = false;
  const minuteur = setInterval(() => {
    if (enCours) return;
    enCours = true;
    void passer().finally(() => {
      enCours = false;
    });
  }, d.intervalleMs ?? INTERVALLE_EXPIRATION_RESERVATIONS_MS);
  minuteur.unref();
  return () => clearInterval(minuteur);
}
