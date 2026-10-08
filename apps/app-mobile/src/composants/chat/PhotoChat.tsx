import { Ionicons } from "@expo/vector-icons";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, Text, useWindowDimensions, View, type PressableProps } from "react-native";
import Animated, { FadeOut, ZoomIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { vibrerJaime } from "~/fonctions/interaction/vibrer-jaime";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Adresse de la photo dans les fichiers de l'app */
  fichier: string | undefined;
  /** Qui l'a envoyée et quand : « Photo de Léa, 14h32 », « Ta photo, 14h32 » */
  libelle: string;
  /** Ta photo : coin arrondi du côté droit, comme tes bulles */
  deMoi: boolean;
  /** Appui long : le menu du message (réactions, signaler) */
  onAppuiLong: () => void;
  /** Double appui sur la photo en grand : bascule ton cœur ; renvoie vrai s'il vient d'être mis (le cœur s'affiche alors en grand) */
  onDoubleAppui: () => boolean;
  /** Actions du lecteur d'écran (cœur, options), posées sur la vignette */
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

const DELAI_DOUBLE_APPUI = 300;
// Ni trop haute, ni trop plate (largeur / hauteur)
const RATIO_MIN = 0.7;
const RATIO_MAX = 1.4;

/** Vrai si le fichier est encore là (sur le web, on ne peut pas vérifier : la photo dira elle-même si elle se charge). */
function existeEncore(fichier: string): boolean {
  if (Platform.OS === "web") return true;
  try {
    return new File(fichier).exists;
  } catch {
    return false;
  }
}

/**
 * Une photo du chat : vignette arrondie à bord encre ; la toucher l'ouvre en grand (double appui en grand : un cœur).
 * Fichier disparu ou illisible : un joli remplaçant plutôt qu'un trou.
 */
export function PhotoChat({ fichier, libelle, deMoi, onAppuiLong, onDoubleAppui, actionsLecteur }: Props) {
  const marges = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const present = useMemo(() => !!fichier && existeEncore(fichier), [fichier]);
  const [illisible, setIllisible] = useState(false);
  const [ratio, setRatio] = useState(0.8);
  const [grande, setGrande] = useState(false);
  // Le cœur qui éclot au double appui (son numéro relance l'animation), puis s'efface
  const [coeur, setCoeur] = useState<number | null>(null);
  const dernierAppui = useRef(0);
  const minuterieCoeur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (minuterieCoeur.current) clearTimeout(minuterieCoeur.current);
    },
    [],
  );

  const largeur = Math.min(240, Math.round(width * 0.62));
  const coins = deMoi ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-tl-md";

  if (!fichier || !present || illisible) {
    return (
      <Pressable
        accessibilityLabel={`${libelle} : partie en vacances, elle ne s'affiche plus`}
        onLongPress={() => {
          vibrerLegerement();
          onAppuiLong();
        }}
        delayLongPress={350}
        {...actionsLecteur}
        style={{ width: largeur }}
        className={`items-center gap-1 border-2 border-dashed border-gris/40 bg-white/70 px-4 py-6 ${coins}`}
      >
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
          📷
        </Text>
        <Text className="text-center font-texte-semi text-sm text-gris">Photo partie en vacances</Text>
      </Pressable>
    );
  }

  function appuiEnGrand() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_DOUBLE_APPUI) {
      dernierAppui.current = 0;
      vibrerJaime();
      if (!onDoubleAppui() || animationsReduites) return;
      setCoeur(maintenant);
      if (minuterieCoeur.current) clearTimeout(minuterieCoeur.current);
      minuterieCoeur.current = setTimeout(() => setCoeur(null), 700);
      return;
    }
    dernierAppui.current = maintenant;
  }

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={libelle}
        accessibilityHint="Ouvre la photo en grand"
        onPress={() => {
          vibrerLegerement();
          setGrande(true);
        }}
        onLongPress={() => {
          vibrerLegerement();
          onAppuiLong();
        }}
        delayLongPress={350}
        {...actionsLecteur}
        style={{ width: largeur, height: largeur / ratio }}
        className={`overflow-hidden border-2 border-encre bg-ligne active:opacity-80 ${coins}`}
      >
        <Image
          source={{ uri: fichier }}
          contentFit="cover"
          transition={animationsReduites ? 0 : 150}
          onLoad={({ source }) => {
            if (source.width > 0 && source.height > 0) setRatio(Math.min(RATIO_MAX, Math.max(RATIO_MIN, source.width / source.height)));
          }}
          onError={() => setIllisible(true)}
          style={{ flex: 1 }}
        />
      </Pressable>

      <Modal visible={grande} transparent animationType="fade" onRequestClose={() => setGrande(false)} statusBarTranslucent>
        <View accessibilityViewIsModal onAccessibilityEscape={() => setGrande(false)} className="flex-1 bg-black">
          <Pressable accessible={false} onPress={appuiEnGrand} style={{ flex: 1 }}>
            <Image
              source={{ uri: fichier }}
              contentFit="contain"
              accessible
              accessibilityLabel={libelle}
              onError={() => {
                setGrande(false);
                setIllisible(true);
              }}
              style={{ flex: 1 }}
            />
          </Pressable>
          {coeur !== null ? (
            <View pointerEvents="none" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
              <Animated.View key={coeur} entering={ZoomIn.springify().damping(12)} exiting={FadeOut.duration(250)}>
                <Text allowFontScaling={false} style={{ fontSize: 96 }}>
                  ❤️
                </Text>
              </Animated.View>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer la photo"
            onPress={() => setGrande(false)}
            hitSlop={8}
            style={{ position: "absolute", top: marges.top + 8, right: 16 }}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-black/60 active:opacity-70"
          >
            <Ionicons name="close" size={24} color={couleurs.creme} />
          </Pressable>
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ position: "absolute", bottom: marges.bottom + 16, left: 20, right: 20 }}
            className="text-center font-texte text-sm text-white/80"
          >
            {libelle} · Double appui pour un ❤️
          </Text>
        </View>
      </Modal>
    </>
  );
}
