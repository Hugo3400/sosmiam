import { useLocalSearchParams } from "expo-router";

import { ContenuSortieMiamis } from "~/composants/miamis/ContenuSortieMiamis";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function EcranSortieMiamis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ouvert, raison } = utiliserAccesMiamis();
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  if (!ouvert || !id) return <EcranMiamisFerme raison={raison} titre={T.barre} />;
  return <ContenuSortieMiamis key={id} id={id} />;
}
