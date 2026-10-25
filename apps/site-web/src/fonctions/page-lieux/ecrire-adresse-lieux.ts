import type { VueLieux } from "~/fonctions/page-lieux/lire-filtres-lieux";
import type { CategorieLieu } from "~/types/lieux";

export type ParametresAdresseLieux = {
  ville?: string | null;
  type?: CategorieLieu | null;
  recherche?: string | null;
  page?: number;
  vue?: VueLieux;
  lieu?: number | null;
};

export function ecrireAdresseLieux({ ville, type, recherche, page = 1, vue = "liste", lieu }: ParametresAdresseLieux): string {
  const parametres = new URLSearchParams();
  if (ville) parametres.set("ville", ville);
  if (type) parametres.set("type", type);
  if (recherche) parametres.set("q", recherche);
  if (page > 1) parametres.set("page", String(page));
  if (vue === "carte") parametres.set("vue", "carte");
  if (lieu) parametres.set("lieu", String(lieu));
  const requete = parametres.toString();
  return requete ? `/lieux?${requete}` : "/lieux";
}
