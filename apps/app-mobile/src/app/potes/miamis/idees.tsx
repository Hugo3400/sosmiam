import { EcranBoiteIdees } from "~/composants/idees-miamis/EcranBoiteIdees";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function BoiteIdees() {
  const acces = utiliserAccesMiamis();
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={T.titre} retourSansHistorique="/reglages" libelleRetour={T.retour} />;
  return <EcranBoiteIdees />;
}
