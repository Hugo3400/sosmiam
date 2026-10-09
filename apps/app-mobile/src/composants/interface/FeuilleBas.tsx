import { useEffect, useRef, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  titre: string;
  sousTitre?: string;
  /** Fond assombri, retour Android, geste d'échappement de VoiceOver : on referme sans rien faire */
  onFermer: () => void;
  /** Le contenu, qui défile si la feuille est trop haute */
  children: ReactNode;
  /** Les boutons du bas, toujours à l'écran (même avec un très grand texte ou le clavier ouvert) */
  pied: ReactNode;
};

/**
 * Feuille qui monte du bas (fondu si les animations sont réduites) : un titre sur lequel VoiceOver se pose à l'ouverture,
 * un contenu qui défile, et des boutons toujours visibles, au-dessus du clavier. Jamais plus haute que 88 % de l'écran.
 */
export function FeuilleBas({ visible, titre, sousTitre, onFermer, children, pied }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const refTitre = useRef<Text>(null);

  useEffect(() => {
    if (!visible) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [visible, animationsReduites]);

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer, sans rien changer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-2">
            <View className="gap-1.5">
              <Text ref={refTitre} accessibilityRole="header" className="font-titre text-2xl text-encre">
                {lierPonctuation(titre)}
              </Text>
              {sousTitre ? <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(sousTitre)}</Text> : null}
            </View>
            {children}
          </ScrollView>
          <View className="mt-4 gap-3 px-5">{pied}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
