import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { TEXTES_QUI_EST_LA } from "~/contenus/textes-qui-est-la";
import type { ResultatAjoutBande } from "~/hooks/utiliser-bande-compte";

export function ecrireResultatAjoutQuiEstLa(resultat: ResultatAjoutBande, pseudo: string): string {
  if (resultat.type === "ajoute" || resultat.type === "deja") return TEXTES_QUI_EST_LA.ajoute(pseudo);
  if (resultat.type === "demande") return TEXTES_QUI_EST_LA.demandePartie(pseudo);
  if (resultat.type === "demandes-fermees") return TEXTES_QUI_EST_LA.demandesFermees(pseudo);
  if (resultat.type === "erreur" && resultat.erreur === "compte-limite") return REFUS_LIMITATION.bande;
  return TEXTES_QUI_EST_LA.ajoutRate;
}
