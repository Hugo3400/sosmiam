import type { CategorieLieu } from "~/types/lieux";

export type VueLieux = "liste" | "carte";

export type FiltresLieux = {
  ville: string | null;
  type: CategorieLieu | null;
  recherche: string | null;
  page: number;
  vue: VueLieux;
  lieu: number | null;
};

const TYPES: ReadonlySet<string> = new Set<CategorieLieu>(["resto", "patisserie", "bar", "sortie"]);
const PAGE_MAX = 1000;

const lireTexte = (brut: string | null, longueurMax: number): string | null => {
  const texte = (brut ?? "").replace(/\s+/g, " ").trim().slice(0, longueurMax).trim();
  return texte || null;
};

export function lireFiltresLieux(parametres: URLSearchParams): FiltresLieux {
  const type = parametres.get("type") ?? "";
  const page = parametres.get("page") ?? "";
  const lieu = parametres.get("lieu") ?? "";
  return {
    ville: lireTexte(parametres.get("ville"), 80),
    type: TYPES.has(type) ? (type as CategorieLieu) : null,
    recherche: lireTexte(parametres.get("q"), 60),
    page: /^\d{1,4}$/.test(page) ? Math.min(Math.max(Number(page), 1), PAGE_MAX) : 1,
    vue: parametres.get("vue") === "carte" ? "carte" : "liste",
    lieu: /^\d{1,9}$/.test(lieu) && Number(lieu) > 0 ? Number(lieu) : null,
  };
}
