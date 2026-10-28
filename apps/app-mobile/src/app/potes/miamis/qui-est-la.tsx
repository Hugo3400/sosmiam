import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { EcranQuiEstLa } from "~/composants/qui-est-la/EcranQuiEstLa";
import { TEXTES_QUI_EST_LA_PAR_LANGUE } from "~/contenus/textes-qui-est-la";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function QuiEstLa() {
  const acces = utiliserAccesMiamis();
  const T = utiliserTextes(TEXTES_QUI_EST_LA_PAR_LANGUE);
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={T.titre} />;
  return <EcranQuiEstLa />;
}
