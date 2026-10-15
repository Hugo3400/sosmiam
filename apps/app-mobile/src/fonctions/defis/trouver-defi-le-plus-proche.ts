import type { DefiAffiche } from "~/contenus/type-defi-affiche";

const lireReste = (defi: DefiAffiche) => defi.objectif - defi.fait;
const lireAvancee = (defi: DefiAffiche) => defi.fait / defi.objectif;

export function trouverDefiLePlusProche(defis: DefiAffiche[]): DefiAffiche | null {
  const enCours = defis.filter((d) => d.etat === "en-cours" && d.attente === null && d.fait < d.objectif);
  return enCours.reduce<DefiAffiche | null>((meilleur, defi) => {
    if (!meilleur) return defi;
    const ecart = lireReste(defi) - lireReste(meilleur);
    if (ecart !== 0) return ecart < 0 ? defi : meilleur;
    return lireAvancee(defi) > lireAvancee(meilleur) ? defi : meilleur;
  }, null);
}
