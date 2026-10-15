import type { FiltresExplorer } from "~/contenus/type-filtres-explorer";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import { lireTexteRechercheLieu } from "~/fonctions/lieux/lire-texte-recherche-lieu";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

export type FiltresLieuxTries = Pick<FiltresExplorer, "texte" | "type" | "ville" | "budgets"> & { ouvertA: Date | null };

export function filtrerLieuxTriesExplorer(lieux: LieuExplorer[], filtres: FiltresLieuxTries): LieuExplorer[] {
  const { type, ville, budgets, ouvertA } = filtres;
  const mots = normaliserRecherche(filtres.texte).split(" ").filter(Boolean);
  if (type === "tous" && !ville && budgets.length === 0 && !ouvertA && mots.length === 0) return lieux;
  return lieux.filter(({ lieu }) => {
    if (type !== "tous" && lieu.type !== type) return false;
    if (ville && lieu.ville !== ville) return false;
    if (budgets.length > 0 && !budgets.includes(lieu.prix)) return false;
    if (ouvertA && !estOuvertMaintenant(lieu, ouvertA)) return false;
    if (mots.length === 0) return true;
    const texte = lireTexteRechercheLieu(lieu);
    return mots.every((mot) => texte.includes(mot));
  });
}
