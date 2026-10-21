import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";

import { TEXTES_REMPLISSAGE as T } from "~/contenus/textes-comptoir-reservations";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import type { RemplissageCreneau } from "~/fonctions/reservations/calculer-remplissage-jour";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";

export type RemplissageCreneauDecrit = { heure: string; places: string; demandes: string | null; complet: boolean; avancee: number; lu: string };

export function decrireRemplissageCreneau(creneau: RemplissageCreneau): RemplissageCreneauDecrit {
  const heure = formaterHeure(creneau.heure);
  const complet = creneau.restantes <= 0;
  const places = complet
    ? T.creneauComplet
    : remplirModele(creneau.restantes === 1 ? T.creneauReste.un : T.creneauReste.plusieurs, { nombre: String(creneau.restantes) });
  const demandes =
    creneau.demandes === 0
      ? null
      : remplirModele(creneau.demandes === 1 ? T.creneauDemandes.un : T.creneauDemandes.plusieurs, {
          nombre: String(creneau.demandes),
          personnes: ecrireNombrePersonnes(creneau.personnesEnAttente),
        });
  const avancee = creneau.arrivees > 0 ? Math.min(1, creneau.acceptes / creneau.arrivees) : 1;
  const debut = remplirModele(T.creneauLu, { heure, acceptes: String(creneau.acceptes), capacite: String(creneau.arrivees) });
  return { heure, places, demandes, complet, avancee, lu: [debut, places, ...(demandes ? [demandes] : [])].join(", ") };
}
