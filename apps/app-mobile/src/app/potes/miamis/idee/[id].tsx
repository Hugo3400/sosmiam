import { useLocalSearchParams } from "expo-router";

import { EcranIdee } from "~/composants/idees-miamis/EcranIdee";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";

export default function IdeeMiamis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const acces = utiliserAccesMiamis();
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={TEXTES_IDEES.barre} />;
  return <EcranIdee key={String(id)} id={String(id)} />;
}
