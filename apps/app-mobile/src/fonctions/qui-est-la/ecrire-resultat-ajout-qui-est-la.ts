import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_QUI_EST_LA_PAR_LANGUE } from "~/contenus/textes-qui-est-la";
import type { ResultatAjoutBande } from "~/hooks/utiliser-bande-compte";

export function ecrireResultatAjoutQuiEstLa(resultat: ResultatAjoutBande, pseudo: string, langue: Langue): string {
  const T = choisirTextes(TEXTES_QUI_EST_LA_PAR_LANGUE, langue);
  if (resultat.type === "ajoute" || resultat.type === "deja") return T.ajoute(pseudo);
  if (resultat.type === "demande") return T.demandePartie(pseudo);
  if (resultat.type === "demandes-fermees") return T.demandesFermees(pseudo);
  if (resultat.type === "erreur" && resultat.erreur === "compte-limite") return choisirTextes(REFUS_LIMITATION_PAR_LANGUE, langue).bande;
  return T.ajoutRate;
}
