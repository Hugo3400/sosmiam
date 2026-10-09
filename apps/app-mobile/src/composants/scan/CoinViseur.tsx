import { View } from "react-native";

import couleurs from "~/theme/couleurs";

const LONGUEUR_COIN = 46;
const EPAISSEUR_COIN = 6;

/** Un coin jaune du viseur, arrondi côté extérieur */
export function CoinViseur({ position }: { position: "haut-gauche" | "haut-droite" | "bas-gauche" | "bas-droite" }) {
  const haut = position.startsWith("haut");
  const gauche = position.endsWith("gauche");
  return (
    <View
      style={{
        position: "absolute",
        width: LONGUEUR_COIN,
        height: LONGUEUR_COIN,
        [haut ? "top" : "bottom"]: -EPAISSEUR_COIN / 2,
        [gauche ? "left" : "right"]: -EPAISSEUR_COIN / 2,
        borderColor: couleurs.jaune,
        borderTopWidth: haut ? EPAISSEUR_COIN : 0,
        borderBottomWidth: haut ? 0 : EPAISSEUR_COIN,
        borderLeftWidth: gauche ? EPAISSEUR_COIN : 0,
        borderRightWidth: gauche ? 0 : EPAISSEUR_COIN,
        borderTopLeftRadius: haut && gauche ? 18 : 0,
        borderTopRightRadius: haut && !gauche ? 18 : 0,
        borderBottomLeftRadius: !haut && gauche ? 18 : 0,
        borderBottomRightRadius: !haut && !gauche ? 18 : 0,
      }}
    />
  );
}
