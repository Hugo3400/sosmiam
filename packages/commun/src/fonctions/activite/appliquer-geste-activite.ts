import { RESCOUSSES_PAR_SEMAINE } from "../../regles/rescousses.ts";
import type { ActiviteApi } from "../../types/activite.ts";
import type { GesteActiviteEnAttente } from "../../types/geste-activite.ts";

/** La liste avec (en tête : le plus récent) ou sans cet élément ; la même liste s'il n'y a rien à changer */
function basculer<T>(liste: T[], element: T, oui: boolean): T[] {
  if (liste.includes(element) === oui) return liste;
  return oui ? [element, ...liste] : liste.filter((x) => x !== element);
}

/** Comme l'API : rien si la rescousse est déjà donnée cette semaine, ou s'il n'en reste plus */
function donner(a: ActiviteApi, lieuId: number): ActiviteApi {
  if (a.rescoussesSemaine.includes(lieuId) || a.restantes <= 0) return a;
  return {
    ...a,
    restantes: a.restantes - 1,
    rescoussesSemaine: [lieuId, ...a.rescoussesSemaine],
    lieuxSauves: [lieuId, ...a.lieuxSauves.filter((id) => id !== lieuId)],
    rescoussesDonnees: a.rescoussesDonnees + 1,
    rescoussesDuMois: a.rescoussesDuMois + 1,
  };
}

/** Seulement la rescousse de cette semaine ; les lieux sauvés et le premier sauveteur attendent la réponse de l'API */
function reprendre(a: ActiviteApi, lieuId: number): ActiviteApi {
  if (!a.rescoussesSemaine.includes(lieuId)) return a;
  return {
    ...a,
    restantes: Math.min(RESCOUSSES_PAR_SEMAINE, a.restantes + 1),
    rescoussesSemaine: a.rescoussesSemaine.filter((id) => id !== lieuId),
    rescoussesDonnees: Math.max(0, a.rescoussesDonnees - 1),
    rescoussesDuMois: Math.max(0, a.rescoussesDuMois - 1),
  };
}

/**
 * L'activité telle qu'elle sera une fois ce geste confirmé par l'API (état affiché tout de suite sur le téléphone).
 * Rend la même activité (le même objet) quand le geste ne change rien : déjà fait, ou refusé d'office (plus de rescousse).
 * Le premier sauveteur n'est jamais deviné : seule la réponse de l'API le donne.
 */
export function appliquerGesteActivite(a: ActiviteApi, geste: GesteActiviteEnAttente): ActiviteApi {
  switch (geste.quoi) {
    case "rescousse":
      return geste.oui ? donner(a, geste.lieuId) : reprendre(a, geste.lieuId);
    case "garde": {
      const gardes = basculer(a.gardes, geste.lieuId, geste.oui);
      return gardes === a.gardes ? a : { ...a, gardes };
    }
    case "jaime": {
      const jaimes = basculer(a.jaimes, geste.publicationId, geste.oui);
      return jaimes === a.jaimes ? a : { ...a, jaimes };
    }
    case "masque": {
      const masques = basculer(a.masques, geste.publicationId, geste.oui);
      return masques === a.masques ? a : { ...a, masques };
    }
    case "suivi": {
      const suivis = basculer(a.suivis, geste.cle, geste.oui);
      return suivis === a.suivis ? a : { ...a, suivis };
    }
  }
}
