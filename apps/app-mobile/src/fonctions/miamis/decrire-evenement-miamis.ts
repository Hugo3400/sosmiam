import type { EvenementMiamis } from "@sos-miam/commun/types/qui-est-la";

export function decrireEvenementMiamis(evenement: EvenementMiamis): string {
  switch (evenement.type) {
    case "idee-proposee":
      return `a proposé « ${evenement.titre} »`;
    case "sortie-rejointe":
      return `rejoint la sortie ${evenement.titre}`;
    case "reponse-brigade":
      return `a répondu à « ${evenement.titre} »`;
    case "votes-idees":
      return evenement.nombre > 1 ? `a voté pour ${evenement.nombre} idées` : "a voté pour une idée";
    case "sortie-organisee":
      return `organise ${evenement.titre}`;
  }
}
