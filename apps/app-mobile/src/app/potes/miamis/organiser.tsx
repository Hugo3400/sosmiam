import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { FormulaireOrganiserSortie } from "~/composants/miamis/FormulaireOrganiserSortie";
import { TEXTES_ORGANISER_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function EcranOrganiserSortieMiamis() {
  const { ouvert, raison } = utiliserAccesMiamis();
  const T = utiliserTextes(TEXTES_ORGANISER_PAR_LANGUE);
  if (!ouvert) return <EcranMiamisFerme raison={raison} titre={T.titre} />;
  return <FormulaireOrganiserSortie />;
}
