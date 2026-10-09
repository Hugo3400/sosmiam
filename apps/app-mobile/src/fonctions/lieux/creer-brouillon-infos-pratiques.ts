import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";

/** Les infos pratiques pendant qu'on les tape : ce qui s'écrit au clavier reste en texte, le reste suit la forme partagée */
export type BrouillonInfosPratiques = Omit<InfosPratiques, "telephone" | "siteWeb" | "instagram"> & { telephone: string; siteWeb: string; instagram: string };

/** Le brouillon de départ d'un formulaire d'infos pratiques (mode pro, proposition de modification), vide si on n'a rien. */
export function creerBrouillonInfosPratiques(i: InfosPratiques | null | undefined): BrouillonInfosPratiques {
  return { ...(i ?? {}), telephone: i?.telephone ?? "", siteWeb: i?.siteWeb ?? "", instagram: i?.instagram ?? "" };
}
