import { useRouter, type Href } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BarreEcranMiamis } from "~/composants/miamis/BarreEcranMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_ACCES_MIAMIS } from "~/contenus/textes-miamis";
import type { RaisonAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  raison: RaisonAccesMiamis;
  titre: string;
  retourSansHistorique?: Href;
  libelleRetour?: string;
};

export function EcranMiamisFerme({ raison, titre, retourSansHistorique, libelleRetour }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const message = raison === "demo" ? TEXTES_ACCES_MIAMIS.demo : raison === "visite" ? TEXTES_ACCES_MIAMIS.visite : TEXTES_ACCES_MIAMIS.bientot;
  const revenir = retourSansHistorique ? () => (router.canGoBack() ? router.back() : router.replace(retourSansHistorique)) : undefined;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEcranMiamis titre={titre} libelleRetour={libelleRetour} onRetour={revenir} />
      {raison === "attente" ? null : (
        <View className="px-5 pt-6">
          <EtatMiamis emoji={message.emoji} titre={message.titre} texte={message.texte} />
        </View>
      )}
    </SafeAreaView>
  );
}
