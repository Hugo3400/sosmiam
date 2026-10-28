import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { INDICE_COMPTE_ANGLAIS } from "~/contenus/anglais/indice-compte";

/**
 * Ce que VoiceOver et TalkBack ajoutent, en visite sans compte, sur un bouton réservé aux inscrits (J'aime, Suivre, Garder…) :
 * la même phrase partout, comme dans le menu « ⋯ » du fil, pour qu'on sache avant de toucher qu'un compte sera demandé.
 */
export const INDICE_COMPTE = "Il te faut un compte, une minute suffit";

export const INDICE_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof INDICE_COMPTE>> = { fr: INDICE_COMPTE, en: INDICE_COMPTE_ANGLAIS };
