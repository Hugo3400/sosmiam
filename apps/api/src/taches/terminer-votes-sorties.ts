// La tâche de la minute des sorties (spécification sociale E.3) : chaque minute, les sorties dont la fin du vote est passée
// reçoivent leur lieu retenu (sorties.terminerVotesEchus : sous le verrou de chaque sortie, choisirLieuGagnant), puis les
// participants sont prévenus (« sortie-lieu-choisi » dans la cloche, et sur le téléphone, hors anti-spam) par le même
// applicateur d'effets que les routes. Un passage ne recouvre jamais le précédent. Lancée par demarrer.ts (pas pendant un
// essai sur un autre schéma, SCHEMA_BASE), arrêtée proprement sur SIGINT et SIGTERM. Dans le journal : des nombres
// seulement, jamais un titre, un nom de lieu ni un compte.
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import type { ServicesSorties } from "../services/sorties-regles.ts";

/** Un passage par minute */
export const INTERVALLE_FIN_DES_VOTES_MS = 60_000;

export type DependancesFinDesVotes = {
  sorties: Pick<ServicesSorties, "terminerVotesEchus">;
  appliquer: AppliquerEffetsSociaux;
  /** Pour les tests ; Date.now par défaut */
  horloge?: () => number;
  intervalleMs?: number;
};

/** Un passage : rend les nombres du bilan (aussi pour les tests) ; ne lève jamais d'erreur */
export async function passerFinDesVotes(d: Omit<DependancesFinDesVotes, "intervalleMs">): Promise<{ terminees: number; echecs: number }> {
  try {
    const { terminees, echecs, effets } = await d.sorties.terminerVotesEchus(new Date((d.horloge ?? Date.now)()));
    if (effets.length > 0) await d.appliquer(effets);
    if (terminees > 0 || echecs > 0) console.log(`Fin des votes des sorties : ${terminees} terminée(s), ${echecs} à reprendre.`);
    return { terminees, echecs };
  } catch (erreur) {
    console.error("Fin des votes des sorties :", resumerErreur(erreur));
    return { terminees: 0, echecs: 0 };
  }
}

/** Planifie le passage de chaque minute (unref : ne retient pas l'arrêt du serveur) ; rend de quoi l'arrêter */
export function planifierFinDesVotes(d: DependancesFinDesVotes): () => void {
  let enCours = false;
  const minuteur = setInterval(() => {
    // Le passage d'avant n'est pas fini (base lente, beaucoup de sorties) : on attend la minute suivante
    if (enCours) return;
    enCours = true;
    void passerFinDesVotes(d).finally(() => {
      enCours = false;
    });
  }, d.intervalleMs ?? INTERVALLE_FIN_DES_VOTES_MS);
  minuteur.unref();
  return () => clearInterval(minuteur);
}
