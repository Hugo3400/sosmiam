import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Linking, View } from "react-native";

import { BanniereThemeSaison } from "~/composants/fil/BanniereThemeSaison";
import { utiliserThemeSaison } from "~/hooks/utiliser-theme-saison";

type Props = { visible: boolean; haut: number; onHauteur: (hauteur: number) => void };

export function BanniereThemeFil({ visible, haut, onHauteur }: Props) {
  const theme = utiliserThemeSaison();
  const router = useRouter();
  const affichee = visible && theme !== null;

  useEffect(() => {
    if (!affichee) onHauteur(0);
  }, [affichee, onHauteur]);

  if (!affichee) return null;
  const ouvrir = () => {
    if (theme.lienInfo) void Linking.openURL(theme.lienInfo.adresse).catch(() => undefined);
    else router.navigate("/explorer");
  };
  return (
    <View pointerEvents="box-none" onLayout={(e) => onHauteur(Math.round(e.nativeEvent.layout.height) + 8)} style={{ position: "absolute", top: haut, left: 14, right: 14 }}>
      <BanniereThemeSaison theme={theme} onAppuyer={ouvrir} />
    </View>
  );
}
