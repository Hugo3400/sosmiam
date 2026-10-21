import { KeyboardAvoidingView, Modal, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
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
  const geste = utiliserGlisserPourFermer(sortieId !== null, onFermer);
  return (
    <Modal visible={sortieId !== null} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          onLayout={geste.mesurerFeuille}
          style={[{ maxHeight: hauteurEcran * 0.88, flexShrink: 1 }, geste.styleFeuille]}
        >
          <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
              {sortieId ? <SignalerContenu cible="miamis" cibleId={sortieId} sujet={`la sortie « ${titre} »`} onTermine={onFermer} /> : null}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
