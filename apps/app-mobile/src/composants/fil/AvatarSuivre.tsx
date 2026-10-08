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
const AVATAR = 48;
const ROND_PLUS = 22;
const ZONE_PLUS = 44;
// Le rond du « + » est centré sur le bord bas de l'avatar ; sa zone de toucher part du haut de ce rond et descend dessous :
// toucher le reste de l'avatar ouvre toujours sa fiche ou sa page, au lieu de le suivre sans le vouloir
const HAUT_PLUS = AVATAR - ROND_PLUS / 2;
// La place du « + » sous l'avatar (le toucher de Fabric s'arrête aux bords de la vue qui le contient) ;
// la marge négative la rend en partie au cœur posé dessous, pour ne pas trop écarter la colonne d'actions
const styleConteneur = { paddingBottom: HAUT_PLUS + ZONE_PLUS - AVATAR, marginBottom: -12 };
// Placement en style et pas en classes : NativeWind ne les applique pas à une Animated.View sur le web
const stylePlus = { position: "absolute", top: HAUT_PLUS } as const;

/**
 * L'auteur en haut de la colonne d'actions : son avatar (vers sa fiche ou sa page) et un petit « + » pour le suivre, tant que
 * tu ne le suis pas. Le « + » est caché au lecteur d'écran : « Suivre » à côté du nom fait la même chose, et reste en place
 * une fois touché (le « + », lui, disparaît : le lecteur d'écran y perdrait sa place).
 */
export function AvatarSuivre({ emoji, nom, createur, suivi, onOuvrir, onSuivre }: Props) {
  const animationsReduites = useReducedMotion();
  return (
    <View style={styleConteneur} className="items-center">
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
        <Animated.View
          exiting={animationsReduites ? undefined : ZoomOut.duration(180)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={stylePlus}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Suivre ${nom}`}
            onPress={() => {
              vibrerLegerement();
              onSuivre();
            }}
            style={{ width: ZONE_PLUS, height: ZONE_PLUS }}
            className="items-center active:scale-90"
          >
            <View style={{ width: ROND_PLUS, height: ROND_PLUS }} className="items-center justify-center rounded-full bg-tomate">
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
