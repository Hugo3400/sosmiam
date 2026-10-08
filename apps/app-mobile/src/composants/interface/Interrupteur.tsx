import { Pressable, Switch, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  titre: string;
  /** Petite phrase sous le titre */
  detail?: string;
  /** Emoji décoratif devant le titre (pas lu : le titre suffit) */
  emoji?: string;
  valeur: boolean;
  onChanger: (valeur: boolean) => void;
  /** Estompé et non touchable (ex. tant que l'interrupteur général est coupé) */
  desactive?: boolean;
};

/**
 * Une ligne de réglage avec un interrupteur : toute la ligne se touche, au moins 56 points de haut.
 * Un seul élément pour VoiceOver et TalkBack (« interrupteur, activé ») : le Switch dessiné à droite leur est caché.
 */
export function Interrupteur({ titre, detail, emoji, valeur, onChanger, desactive = false }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={titre}
      accessibilityHint={detail}
      accessibilityState={{ checked: valeur, disabled: desactive }}
      disabled={desactive}
      onPress={() => {
        vibrerLegerement();
        onChanger(!valeur);
      }}
      className={`min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70 ${desactive ? "opacity-40" : ""}`}
    >
      {emoji ? <Text className="text-2xl">{emoji}</Text> : null}
      <View className="flex-1">
        <Text className="font-texte-gras text-base text-encre">{titre}</Text>
        {detail ? <Text className="font-texte text-sm text-gris">{detail}</Text> : null}
      </View>
      {/* Simple dessin : c'est la ligne entière qui reçoit le toucher et qui parle au lecteur d'écran */}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch
          value={valeur}
          trackColor={{ false: couleurs.ligne, true: couleurs.encre }}
          ios_backgroundColor={couleurs.ligne}
          thumbColor={valeur ? couleurs.jaune : couleurs.gris}
        />
      </View>
    </Pressable>
  );
}
