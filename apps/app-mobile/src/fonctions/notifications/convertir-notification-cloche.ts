import { TYPES_CLOCHE } from "@sos-miam/commun/regles/cloche";
import { TYPES_CLOCHE_COMMUNAUTE } from "@sos-miam/commun/regles/communaute";
import type { NotificationClocheApi } from "@sos-miam/commun/types/cloche";
import { ecrireCleSuivi } from "~/fonctions/suivi/ecrire-cle-suivi";
import type { NotificationApp } from "~/hooks/utiliser-notifications";

/**
 * Une notification de la cloche du serveur, au format de l'écran Notifications. « … te suit » et « demande acceptée »
 * prennent la forme de la démo (la clé de la personne qui agit) ; sans elle (compte supprimé), il n'y a rien à dire. Un type
 * que cette version de l'app ne connaît pas encore est laissé de côté plutôt que mal affiché.
 */
export function convertirNotificationCloche(n: NotificationClocheApi): NotificationApp | null {
  if (![...TYPES_CLOCHE, ...TYPES_CLOCHE_COMMUNAUTE].some((type) => type === n.type)) return null;
  const base = { id: `cloche:${n.id}`, date: n.date };
  if (n.type === "nouvel-abonne" || n.type === "demande-acceptee") {
    if (!n.acteur) return null;
    const cle = ecrireCleSuivi({ type: "personne", id: n.acteur.id });
    return n.type === "nouvel-abonne" ? { ...base, type: "nouvel-abonne", cle, enRetour: n.enRetour } : { ...base, type: "demande-acceptee", cle };
  }
  return { ...base, type: "cloche", sorte: n.type, acteur: n.acteur, cible: n.cible, detail: n.detail };
}
