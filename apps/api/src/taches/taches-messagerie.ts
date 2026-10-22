import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import type { BilanTachesMessagerie, ServicesMessagerie } from "../services/messagerie-regles.ts";

export const INTERVALLE_TACHES_MESSAGERIE_MS = 60_000;

export type DependancesTachesMessagerie = {
  messagerie: Pick<ServicesMessagerie, "passerTaches">;
  appliquer: AppliquerEffetsSociaux;
  horloge?: () => number;
  intervalleMs?: number;
};

export async function passerTachesMessagerie(d: Omit<DependancesTachesMessagerie, "intervalleMs">): Promise<Omit<BilanTachesMessagerie, "effets">> {
  try {
    const { sondages, rappels, echecs, effets } = await d.messagerie.passerTaches(new Date((d.horloge ?? Date.now)()));
    if (effets.length > 0) await d.appliquer(effets);
    if (sondages > 0 || rappels > 0 || echecs > 0) console.log(`Messagerie : ${sondages} sondage(s) clos, ${rappels} rappel(s) de sortie, ${echecs} à reprendre.`);
    return { sondages, rappels, echecs };
  } catch (erreur) {
    console.error("Tâches de la messagerie :", resumerErreur(erreur));
    return { sondages: 0, rappels: 0, echecs: 0 };
  }
}

export function planifierTachesMessagerie(d: DependancesTachesMessagerie): () => void {
  let enCours = false;
  const minuteur = setInterval(() => {
    if (enCours) return;
    enCours = true;
    void passerTachesMessagerie(d).finally(() => {
      enCours = false;
    });
  }, d.intervalleMs ?? INTERVALLE_TACHES_MESSAGERIE_MS);
  minuteur.unref();
  return () => clearInterval(minuteur);
}
