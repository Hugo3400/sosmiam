import { View } from "react-native";

import { ContenuAccueilMiamis } from "~/composants/miamis/ContenuAccueilMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_ACCES_MIAMIS } from "~/contenus/textes-miamis";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";

export function AccueilMiamis() {
  const { ouvert, raison } = utiliserAccesMiamis();
  if (ouvert) return <ContenuAccueilMiamis />;
  if (raison === "attente") return null;
  const message = raison === "demo" ? TEXTES_ACCES_MIAMIS.demo : TEXTES_ACCES_MIAMIS.visite;
  return (
    <View className="px-5">
      <EtatMiamis emoji={message.emoji} titre={message.titre} texte={message.texte} />
    </View>
  );
}
