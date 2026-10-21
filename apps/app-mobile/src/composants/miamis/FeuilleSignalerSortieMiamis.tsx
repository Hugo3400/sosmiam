import { KeyboardAvoidingView, Modal, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";

type Props = {
  sortieId: string | null;
  titre: string;
  onFermer: () => void;
};

export function FeuilleSignalerSortieMiamis({ sortieId, titre, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const animationsReduites = useReducedMotion();
  const { height: hauteurEcran } = useWindowDimensions();
  utiliserInscriptionFeuille(sortieId !== null, onFermer);
  return (
    <Modal visible={sortieId !== null} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
            {sortieId ? <SignalerContenu cible="miamis" cibleId={sortieId} sujet={`la sortie « ${titre} »`} onTermine={onFermer} /> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
