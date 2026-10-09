import { creerDonneesExemplePotes, EXEMPLES_CORRIGES_V3, VERSION_EXEMPLES } from "~/contenus/potes-exemples";
import type { CommunauteLocale } from "~/stockage/communaute-locale";

/**
 * Une démo déjà enregistrée sur le téléphone se met à jour une seule fois (la version, notée ensuite, l'empêche de recommencer) :
 * - avant la version 2, elle reçoit les exemples qui lui manquent (sorties passées, lieux reçus, nouvelles, listes) ;
 * - avant la version 3, les exemples corrigés depuis remplacent les siens, seulement s'ils y sont encore : un exemple que la
 *   personne a retiré ne revient jamais. Un lieu reçu garde son « vu ».
 * Ce que la personne a changé reste : ses potes, ses sorties, ce qu'elle a retiré.
 */
export function ajouterNouveauxExemples(lue: CommunauteLocale, maintenant: Date): CommunauteLocale {
  const version = lue.exemples ?? 1;
  if (version >= VERSION_EXEMPLES) return lue;
  const exemples = creerDonneesExemplePotes(maintenant);
  const mettreAJour = <T extends { id: string }>(deja: T[], nouveaux: T[], garder: (avant: T, apres: T) => T = (_avant, apres) => apres) => {
    const corriges = new Map(nouveaux.filter((x) => EXEMPLES_CORRIGES_V3.includes(x.id)).map((x) => [x.id, x] as const));
    const remplaces = version < 3 ? deja.map((x) => (corriges.has(x.id) ? garder(x, corriges.get(x.id)!) : x)) : deja;
    if (version >= 2) return remplaces;
    const ids = new Set(deja.map((x) => x.id));
    return [...remplaces, ...nouveaux.filter((x) => !ids.has(x.id))];
  };
  return {
    ...lue,
    exemples: VERSION_EXEMPLES,
    sorties: mettreAJour(lue.sorties, exemples.sorties),
    listes: mettreAJour(lue.listes, exemples.listes, (avant, apres) => ({ ...apres, abonnes: avant.abonnes })),
    activites: mettreAJour(lue.activites, exemples.activites),
    recommandations: mettreAJour(lue.recommandations, exemples.recommandations, (avant, apres) => ({ ...apres, vue: avant.vue })),
  };
}
