import { View } from "react-native";

import { ContenuAccueilMiamis } from "~/composants/miamis/ContenuAccueilMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_ACCES_MIAMIS_PAR_LANGUE } from "~/contenus/textes-miamis";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function AccueilMiamis() {
  const T = utiliserTextes(TEXTES_ACCES_MIAMIS_PAR_LANGUE);
  const { ouvert, raison } = utiliserAccesMiamis();
  if (ouvert) return <ContenuAccueilMiamis />;
  if (raison === "attente") return null;
  const message = T.visite;
  return (
    <View className="px-5">
      <EtatMiamis emoji={message.emoji} titre={message.titre} texte={message.texte} />
    </View>
  );
}
