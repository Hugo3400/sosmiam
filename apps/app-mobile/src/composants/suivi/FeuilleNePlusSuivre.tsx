import { useEffect, useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  /** Qui on arrête de suivre : « @lea.mange » ou le nom du lieu */
  nom: string;
  /** Son emoji (🎬 pour un créateur, celui du lieu), dans le rond jaune */
  emoji: string;
  /** « Ne plus suivre » touché : arrête le suivi (et annonce-le). La feuille appelle ensuite onFermer. */
  onConfirmer: () => void;
  /** « Je reste », fond assombri, retour Android ou geste d'échappement de VoiceOver : on ne touche à rien */
  onFermer: () => void;
};

/**
 * Petite feuille qui monte du bas avant d'arrêter de suivre un lieu ou un créateur (comme Instagram ou TikTok) :
 * on ne désabonne jamais sur un seul toucher. « Ne plus suivre » ou « Je reste ».
 */
export function FeuilleNePlusSuivre({ visible, nom, emoji, onConfirmer, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const animationsReduites = useReducedMotion();
  const titre = useRef<Text>(null);

  // VoiceOver commence par le titre (sinon il tombe sur le fond « Fermer »), une fois la feuille arrivée
  useEffect(() => {
    if (!visible) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(titre.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [visible, animationsReduites]);

  // Animations réduites dans les réglages : la feuille apparaît en fondu au lieu de monter du bas
  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      {/* Le fond garde au moins la hauteur de la barre d'état : la feuille ne passe jamais dessous */}
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer, sans rien changer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        style={{ paddingBottom: marges.bottom + 12 }}
        className="rounded-t-3xl border-t-2 border-encre bg-creme px-5 pt-3"
      >
        <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-ligne" />
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="mb-3 h-16 w-16 items-center justify-center self-center rounded-full border-2 border-encre bg-jaune"
        >
          <Text className="text-3xl">{emoji}</Text>
        </View>
        <Text ref={titre} accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
          {lierPonctuation(`Ne plus suivre ${nom} ?`)}
        </Text>
        <Text className="mt-2 text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Ses publications ne passeront plus en tête de ton fil. Pas de drame, pas de porte qui claque : tu pourras revenir quand tu veux.")}
        </Text>
        <View className="mt-5 gap-3">
          <Bouton
            libelle="Ne plus suivre"
            variante="encre"
            onPress={() => {
              onConfirmer();
              onFermer();
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityHint={`Tu continues de suivre ${nom}`}
            onPress={onFermer}
            className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Text className="font-texte-gras text-base text-encre">Je reste</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
