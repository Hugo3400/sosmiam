import type { IdBadge } from "@sos-miam/commun/types/badge";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { PRECISIONS_BADGES_ANGLAIS } from "~/contenus/anglais/precisions-badges";

/**
 * Ce que la grille des badges ajoute sous un badge pas encore obtenu (les autres : « possible dès maintenant »). `possible` :
 * faux quand personne ne peut encore le gagner, faute de mesure : le serveur ne le donne pas encore (BADGES_AUTOMATIQUES,
 * packages/commun/src/regles/badges-automatiques.ts, ne sait compter ni le type de plat, ni une sortie validée à plusieurs).
 * Emoji, nom et texte : le catalogue partagé, BADGES (packages/commun/src/contenus/badges.ts).
 */
export const PRECISIONS_BADGES: Partial<Record<IdBadge, { possible: boolean; texte: string }>> = {
  "coeur-sur-la-main": { possible: true, texte: "Un lieu en SOS a des tables à remplir : fais valider ta visite pendant son SOS, la Brigade te dit merci !" },
  "bonne-etoile": { possible: true, texte: "Un SOS par-ci, un SOS par-là : fais valider une visite dans 3 lieux différents pendant leur SOS. Ils s'en souviendront !" },
  vigie: { possible: true, texte: "Un lieu reste tout neuf 30 jours après son arrivée : à toi d'être le premier à lui donner une rescousse !" },
  "deniche-par-toi": { possible: true, texte: "Ça se passe sur ambassadeur.sosmiam.fr : propose ton lieu chouchou !" },
  fondateur: { possible: true, texte: "Les places de fondateur se prennent sur ambassadeur.sosmiam.fr." },
  iode: { possible: false, texte: "Il arrivera quand l'app saura ce qu'il y a dans ton assiette. Les huîtres peuvent patienter !" },
  bande: { possible: false, texte: "Les sorties entre potes sont là, mais on ne compte pas encore les visites à plusieurs. Garde ta bande au chaud : il arrive bientôt !" },
};

export const PRECISIONS_BADGES_PAR_LANGUE: ParLangue<Traduction<typeof PRECISIONS_BADGES>> = { fr: PRECISIONS_BADGES, en: PRECISIONS_BADGES_ANGLAIS };
