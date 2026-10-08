import { View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

type Props = {
  nombre: number;
  /** Photo affichée (à partir de 0) */
  actuelle: number;
  /** Avancée de la photo affichée, de 0 à 1, animée sans nouveau rendu */
  avancee: SharedValue<number>;
  /** Largeur de l'écran, pour savoir jusqu'où remplir la barre en cours */
  largeur: number;
  /** Bas de la zone où poser les barres (le haut de la rangée d'indications) */
  haut: number;
};

const MARGE = 16;
const ECART = 4;
const EPAISSEUR = 3;

/** Les barres façon stories en haut d'une publication photos : une par photo, celle en cours se remplit. Décoratives (la pastille « Photo 1 sur 3 » le dit déjà). */
export function BarresPhotos({ nombre, actuelle, avancee, largeur, haut }: Props) {
  const largeurBarre = Math.max(0, (largeur - MARGE * 2 - ECART * (nombre - 1)) / nombre);
  // Un seul remplissage animé, posé dans la barre de la photo en cours ; il glisse depuis la gauche
  const styleRemplissage = useAnimatedStyle(() => ({
    transform: [{ translateX: -largeurBarre * (1 - Math.min(Math.max(avancee.value, 0), 1)) }],
  }));

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ top: haut - EPAISSEUR - 3, left: MARGE, right: MARGE, gap: ECART }}
      className="absolute flex-row"
    >
      {Array.from({ length: nombre }, (_, i) => (
        <View key={i} style={{ width: largeurBarre, height: EPAISSEUR }} className="overflow-hidden rounded-full bg-white/35">
          {i < actuelle ? <View className="absolute inset-0 bg-white" /> : null}
          {i === actuelle ? (
            <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: largeurBarre, backgroundColor: "#FFFFFF" }, styleRemplissage]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}
