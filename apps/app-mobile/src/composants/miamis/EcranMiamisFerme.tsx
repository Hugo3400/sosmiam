import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BarreEcranMiamis } from "~/composants/miamis/BarreEcranMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_ACCES_MIAMIS } from "~/contenus/textes-miamis";
import type { RaisonAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import couleurs from "~/theme/couleurs";

type Props = {
  raison: RaisonAccesMiamis;
  titre: string;
};

export function EcranMiamisFerme({ raison, titre }: Props) {
  const message = raison === "demo" ? TEXTES_ACCES_MIAMIS.demo : raison === "visite" ? TEXTES_ACCES_MIAMIS.visite : TEXTES_ACCES_MIAMIS.bientot;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEcranMiamis titre={titre} />
      {raison === "attente" ? null : (
        <View className="px-5 pt-6">
          <EtatMiamis emoji={message.emoji} titre={message.titre} texte={message.texte} />
        </View>
      )}
    </SafeAreaView>
  );
}
