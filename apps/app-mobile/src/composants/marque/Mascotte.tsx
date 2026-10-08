import { Text, View } from "react-native";

import couleurs from "~/theme/couleurs";

/** Les expressions de la bouée (mêmes que sur le site : apps/site-web/src/composants/marque/Bouee.tsx). */
export type ExpressionMascotte = "miam" | "clin" | "surprise";

type Props = {
  expression: ExpressionMascotte;
  /** Largeur et hauteur, en points */
  taille?: number;
};

/** La mascotte de SOS Miam. PROVISOIRE : à remplacer par le dessin du kit de marque (react-native-svg), même API. Décorative. */
export function Mascotte({ expression, taille = 160 }: Props) {
  const visage = { miam: "😋", clin: "😉", surprise: "😮" }[expression];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2, backgroundColor: couleurs["jaune-clair"] }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize: taille * 0.45 }}>🛟</Text>
      <Text style={{ position: "absolute", fontSize: taille * 0.22 }}>{visage}</Text>
    </View>
  );
}
