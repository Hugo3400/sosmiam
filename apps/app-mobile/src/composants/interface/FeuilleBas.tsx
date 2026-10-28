import { useEffect, useRef, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { TEXTES_INTERFACE_PAR_LANGUE } from "~/contenus/textes-interface";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserTitreDansPoignee } from "~/hooks/utiliser-titre-dans-poignee";

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
  const T = utiliserTextes(TEXTES_INTERFACE_PAR_LANGUE);
  // Inscrite parmi les feuilles ouvertes : l'annonce d'un compte limité la referme avant « Voir pourquoi » (et l'attend sur Android)
  utiliserInscriptionFeuille(visible, onFermer);
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const refTitre = useRef<Text>(null);
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  const titreDansPoignee = utiliserTitreDansPoignee(visible);

  useEffect(() => {
    if (!visible) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [visible, animationsReduites]);

  const enTete = (
    <Text ref={refTitre} accessibilityRole="header" className="font-titre text-2xl text-encre">
      {lierPonctuation(titre)}
    </Text>
  );
  const texteSousTitre = sousTitre ? <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(sousTitre)}</Text> : null;
  const margeHaut = titreDansPoignee ? (sousTitre ? "pt-1.5" : "pt-5") : "";

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={T.fermerSansChanger} onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          onLayout={geste.mesurerFeuille}
          style={[{ maxHeight: hauteurEcran * 0.88, flexShrink: 1 }, geste.styleFeuille]}
        >
          <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
            <PoigneeFeuille geste={geste} ecart="grand" className="px-5">
              {titreDansPoignee ? enTete : null}
            </PoigneeFeuille>
            <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerClassName={`gap-5 px-5 pb-2 ${margeHaut}`}>
              {titreDansPoignee ? (
                texteSousTitre
              ) : (
                <View className="gap-1.5">
                  {enTete}
                  {texteSousTitre}
                </View>
              )}
              {children}
            </ScrollView>
            <View className="mt-4 gap-3 px-5">{pied}</View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
