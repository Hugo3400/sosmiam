import type { BadgeCatalogue } from "@sos-miam/commun/types/badge";
import { type FamilleDeBadges, TITRE_FAMILLE_AUTRES } from "~/contenus/familles-badges";

export function grouperBadgesParFamille(
  catalogue: readonly BadgeCatalogue[],
  familles: readonly FamilleDeBadges[],
): { titre: string; badges: BadgeCatalogue[] }[] {
  const ranges = new Set<string>();
  const groupes = familles.map((famille) => ({
    titre: famille.titre,
    badges: famille.badges.flatMap((id) => {
      const badge = catalogue.find((b) => b.id === id);
      if (!badge || ranges.has(id)) return [];
      ranges.add(id);
      return [badge];
    }),
  }));
  const autres = { titre: TITRE_FAMILLE_AUTRES, badges: catalogue.filter((b) => !ranges.has(b.id)) };
  return [...groupes, autres].filter((groupe) => groupe.badges.length > 0);
}
