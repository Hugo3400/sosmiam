import { EcranBoiteIdees } from "~/composants/idees-miamis/EcranBoiteIdees";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";

export default function BoiteIdees() {
  const acces = utiliserAccesMiamis();
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={TEXTES_IDEES.titre} />;
  return <EcranBoiteIdees />;
}
