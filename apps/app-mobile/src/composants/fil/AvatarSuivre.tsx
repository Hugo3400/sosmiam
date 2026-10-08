import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Animated, { ZoomOut, useReducedMotion } from "react-native-reanimated";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  /** Emoji de l'avatar : celui du lieu, ou 🎬 pour un créateur */
  emoji: string;
  /** Auteur lu par VoiceOver : « @lea.mange » ou le nom du lieu */
  nom: string;
  /** Un créateur ouvre sa page ; un lieu, sa fiche */
  createur: boolean;
  suivi: boolean;
  onOuvrir: () => void;
  onSuivre: () => void;
};

// Sur une vidéo claire, une ombre garde l'avatar lisible (comme les icônes de la colonne d'actions)
const ombre = { shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } };

/** L'auteur en haut de la colonne d'actions : son avatar (vers sa fiche ou sa page) et un petit « + » pour le suivre, tant que tu ne le suis pas. */
export function AvatarSuivre({ emoji, nom, createur, suivi, onOuvrir, onSuivre }: Props) {
  const animationsReduites = useReducedMotion();
  return (
    // La place sous l'avatar accueille le « + », à cheval sur son bord
    <View className="items-center pb-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={createur ? `Voir la page de ${nom}` : `Voir la fiche de ${nom}`}
        hitSlop={4}
        onPress={() => {
          vibrerLegerement();
          onOuvrir();
        }}
        style={ombre}
        className="h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-jaune active:opacity-80"
      >
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-[22px]">
          {emoji}
        </Text>
      </Pressable>
      {suivi ? null : (
        <Animated.View exiting={animationsReduites ? undefined : ZoomOut.duration(180)} className="absolute bottom-0">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Suivre ${nom}`}
            accessibilityHint="Ses prochaines publications passeront en tête de ton fil"
            // 40 × 32 pt posés sur le bas de l'avatar, 44 × 44 pt sous le doigt
            hitSlop={{ top: 4, bottom: 8, left: 2, right: 2 }}
            onPress={() => {
              vibrerLegerement();
              onSuivre();
            }}
            className="h-8 w-10 items-center justify-center active:scale-90"
          >
            <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-tomate">
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
