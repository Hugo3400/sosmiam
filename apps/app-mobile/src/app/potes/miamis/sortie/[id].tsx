import { useLocalSearchParams } from "expo-router";

import { ContenuSortieMiamis } from "~/composants/miamis/ContenuSortieMiamis";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";

export default function EcranSortieMiamis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ouvert, raison } = utiliserAccesMiamis();
  if (!ouvert || !id) return <EcranMiamisFerme raison={raison} titre={TEXTES_SORTIE_MIAMIS.barre} />;
  return <ContenuSortieMiamis key={id} id={id} />;
}
