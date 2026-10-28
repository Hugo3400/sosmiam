import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { EvenementMiamis } from "@sos-miam/commun/types/qui-est-la";
import { TEXTES_FIL_MIAMIS_PAR_LANGUE } from "~/contenus/textes-fil-miamis";

export function decrireEvenementMiamis(evenement: EvenementMiamis, langue: Langue): string {
  const T = choisirTextes(TEXTES_FIL_MIAMIS_PAR_LANGUE, langue);
  switch (evenement.type) {
    case "idee-proposee":
      return T.ideeProposee(evenement.titre);
    case "sortie-rejointe":
      return T.sortieRejointe(evenement.titre);
    case "reponse-brigade":
      return T.reponseBrigade(evenement.titre);
    case "votes-idees":
      return T.votesIdees(evenement.nombre);
    case "sortie-organisee":
      return T.sortieOrganisee(evenement.titre);
  }
}
