import type { BrouillonCarte } from "../../types/carte.ts";
import { nommerChampCarte } from "./nommer-champ-carte.ts";

/**
 * Les valeurs de départ des champs de l'éditeur de carte, par nom de champ, comme les lisent les champs des formulaires
 * de l'espace (ChampTexte, CaseACocher : « oui » si cochée, ChoixMultiples : choix séparés par des virgules).
 */
export function ecrireValeursBrouillon(brouillon: BrouillonCarte): Record<string, string> {
  const valeurs: Record<string, string> = {};
  brouillon.sections.forEach((section, i) => {
    valeurs[nommerChampCarte(i, "titre")] = section.titre;
    section.elements.forEach((element, j) => {
      const nom = (champ: string) => nommerChampCarte(i, champ, j);
      Object.assign(valeurs, {
        [nom("nom")]: element.nom, [nom("description")]: element.description, [nom("prix")]: element.prix, [nom("unite")]: element.unite,
        [nom("etiquettes")]: element.etiquettes.join(","),
      });
      if (element.signature) valeurs[nom("signature")] = "oui";
      if (element.alcool) valeurs[nom("alcool")] = "oui";
    });
  });
  return valeurs;
}
