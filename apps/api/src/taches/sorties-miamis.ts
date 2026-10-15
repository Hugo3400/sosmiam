import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { ServicesSortiesMiamis } from "../services/communaute-regles.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";

export const INTERVALLE_TACHES_SORTIES_MIAMIS_MS = 5 * 60_000;

export type DependancesTachesSortiesMiamis = {
  sorties: Pick<ServicesSortiesMiamis, "passerTaches">;
  appliquer: AppliquerEffetsSociaux;
  horloge?: () => number;
  intervalleMs?: number;
};

export async function passerTachesSortiesMiamis(d: Omit<DependancesTachesSortiesMiamis, "intervalleMs">): Promise<{ rappels: number; suites: number; echecs: number }> {
  try {
    const { rappels, suites, echecs, effets } = await d.sorties.passerTaches(new Date((d.horloge ?? Date.now)()));
    if (effets.length > 0) await d.appliquer(effets);
    if (rappels > 0 || suites > 0 || echecs > 0) console.log(`Sorties des Miamis : ${rappels} rappel(s), ${suites} sortie(s) de la semaine suivante, ${echecs} à reprendre.`);
    return { rappels, suites, echecs };
  } catch (erreur) {
    console.error("Sorties des Miamis :", resumerErreur(erreur));
    return { rappels: 0, suites: 0, echecs: 0 };
  }
}

export function planifierTachesSortiesMiamis(d: DependancesTachesSortiesMiamis): () => void {
  let enCours = false;
  const minuteur = setInterval(() => {
    if (enCours) return;
    enCours = true;
    void passerTachesSortiesMiamis(d).finally(() => {
      enCours = false;
    });
  }, d.intervalleMs ?? INTERVALLE_TACHES_SORTIES_MIAMIS_MS);
  minuteur.unref();
  return () => clearInterval(minuteur);
}
