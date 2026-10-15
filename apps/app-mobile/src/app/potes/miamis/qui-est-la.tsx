import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { EcranQuiEstLa } from "~/composants/qui-est-la/EcranQuiEstLa";
import { TEXTES_QUI_EST_LA } from "~/contenus/textes-qui-est-la";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";

export default function QuiEstLa() {
  const acces = utiliserAccesMiamis();
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={TEXTES_QUI_EST_LA.titre} />;
  return <EcranQuiEstLa />;
}
