import { useLocalSearchParams } from "expo-router";

import { EcranIdee } from "~/composants/idees-miamis/EcranIdee";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function IdeeMiamis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const acces = utiliserAccesMiamis();
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={T.barre} retourSansHistorique="/reglages" />;
  return <EcranIdee key={String(id)} id={String(id)} />;
}
