import type { SourceLieu } from "../types/source-lieu.ts";

export type SourceConnue = SourceLieu & { hote: string };

const LICENCE_OUVERTE = { nom: "Licence Ouverte 2.0", adresse: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/" };

export const SOURCES_LIEUX: readonly SourceConnue[] = [
  { hote: "datatourisme.fr", nom: "DATAtourisme", site: "datatourisme.fr", adresse: "https://www.datatourisme.fr", licence: LICENCE_OUVERTE },
  { hote: "montpellier-tourisme.fr", nom: "l'office de tourisme de Montpellier", site: "montpellier-tourisme.fr", adresse: "https://www.montpellier-tourisme.fr", licence: null },
  { hote: "visiterlyon.com", nom: "l'office de tourisme de Lyon", site: "visiterlyon.com", adresse: "https://www.visiterlyon.com", licence: null },
  { hote: "lilletourism.com", nom: "l'office de tourisme de Lille", site: "lilletourism.com", adresse: "https://www.lilletourism.com", licence: null },
  { hote: "marseille-tourisme.com", nom: "l'office de tourisme de Marseille", site: "marseille-tourisme.com", adresse: "https://www.marseille-tourisme.com", licence: null },
];
