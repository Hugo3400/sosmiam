import { useEffect, useRef } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
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
  /** « Ne plus suivre » touché : arrête le suivi tout de suite (une seule fois, même sur un double appui). La feuille appelle ensuite onFermer. */
  onConfirmer: () => void;
  /**
   * La feuille a fini de se refermer après « Ne plus suivre » : c'est le moment de l'annoncer. Plus tôt, VoiceOver, qui revient
   * sur le bouton à la fermeture, couperait l'annonce.
   */
  onRefermee: () => void;
  /** « Je reste », fond assombri, retour Android ou geste d'échappement de VoiceOver : on ne touche à rien */
  onFermer: () => void;
};

// Seul iOS dit quand la feuille a fini de se refermer : ailleurs, on attend la fin de sa glissade
const DUREE_FERMETURE = 450;

/**
 * Petite feuille qui monte du bas avant d'arrêter de suivre un lieu ou un créateur (comme Instagram ou TikTok) :
 * on ne désabonne jamais sur un seul toucher. « Ne plus suivre » ou « Je reste ». Avec un très grand texte, le haut
 * de la feuille défile et les deux boutons restent toujours à l'écran.
 */
export function FeuilleNePlusSuivre({ visible, nom, emoji, onConfirmer, onRefermee, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const titre = useRef<Text>(null);
  // « Ne plus suivre » touché, feuille pas encore refermée
  const confirmee = useRef(false);
  const minuterieFermeture = useRef<ReturnType<typeof setTimeout> | null>(null);

  // VoiceOver commence par le titre (sinon il tombe sur le fond « Fermer »), une fois la feuille arrivée
  useEffect(() => {
    if (!visible) return;
    confirmee.current = false;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(titre.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [visible, animationsReduites]);

  useEffect(
    () => () => {
      if (minuterieFermeture.current) clearTimeout(minuterieFermeture.current);
    },
    [],
  );

  function confirmer() {
    if (confirmee.current) return;
    confirmee.current = true;
    onConfirmer();
    onFermer();
    if (Platform.OS !== "ios") minuterieFermeture.current = setTimeout(finirFermeture, DUREE_FERMETURE);
  }

  function finirFermeture() {
    if (!confirmee.current) return;
    confirmee.current = false;
    onRefermee();
  }

  // Animations réduites dans les réglages : la feuille apparaît en fondu au lieu de monter du bas
  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer} onDismiss={finirFermeture}>
      {/* Le fond garde au moins la hauteur de la barre d'état : la feuille ne passe jamais dessous */}
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer, sans rien changer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        // Comme le menu « ⋯ » : jamais plus haute que l'écran, le texte défile au-dessus des boutons
        style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
        className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
      >
        <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-ligne" />
        <ScrollView style={{ flexGrow: 0 }} contentContainerClassName="px-5">
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
        </ScrollView>
        <View className="mt-5 gap-3 px-5">
          <Bouton libelle="Ne plus suivre" variante="encre" onPress={confirmer} />
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
