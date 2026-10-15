import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { FormulaireOrganiserSortie } from "~/composants/miamis/FormulaireOrganiserSortie";
import { TEXTES_ORGANISER } from "~/contenus/textes-sorties-miamis";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";

export default function EcranOrganiserSortieMiamis() {
  const { ouvert, raison } = utiliserAccesMiamis();
  if (!ouvert) return <EcranMiamisFerme raison={raison} titre={TEXTES_ORGANISER.titre} />;
  return <FormulaireOrganiserSortie />;
}
