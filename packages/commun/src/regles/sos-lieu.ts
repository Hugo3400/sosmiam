// SOS « place ce soir » et message du moment d'un lieu (décidé le 9 octobre 2026 au soir, docs/decisions.md) : lancés par le
// gérant ou l'équipe, un SOS par jour jusqu'à la fermeture, un message qui s'efface tout seul (24 h au plus).

/** Places à remplir annoncées par un SOS */
export const SOS_PLACES_MIN = 1;
export const SOS_PLACES_MAX = 30;

/** L'offre facultative d'un SOS (« Un tiramisu offert ») */
export const SOS_OFFRE_MAX = 80;

/** Un seul SOS par jour (jour de Paris), arrêté ou non */
export const SOS_PAR_JOUR = 1;

/** Sans horaires connus, un SOS ou un message s'arrête au plus tard à cette heure-là, le lendemain matin (heure de Paris) */
export const HEURE_LIMITE_SANS_HORAIRES = "04:00";

/** Le message du moment (« Happy hour jusqu'à 20 h ») : sa longueur (la colonne de la base en garde 80) et sa durée maximale */
export const MESSAGE_MOMENT_MAX = 80;
export const DUREE_MESSAGE_MOMENT_MAX_MS = 24 * 60 * 60_000;
