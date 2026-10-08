import { useEffect, useRef } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  /** Dans le rond jaune, en haut de la feuille (pas lu par VoiceOver) */
  emoji: string;
  /** La question : « Ne plus suivre Léa ? », « Retirer Karim de tes abonnés ? » */
  titre: string;
  /** Ce qui va se passer, en une ou deux phrases */
  detail: string;
  /** Le bouton qui agit (fond encre) : « Ne plus suivre », « Retirer » */
  libelleConfirmer: string;
  /** Le bouton qui ne change rien (fond blanc) : « Je reste », « Finalement non » */
  libelleRester: string;
  /** Lu par VoiceOver sur le bouton qui ne change rien : « Tu continues de suivre Léa » */
  indiceRester?: string;
  /** Le bouton qui agit est touché : agit tout de suite (une seule fois, même sur un double appui). La feuille appelle ensuite onFermer. */
  onConfirmer: () => void;
  /**
   * Facultatif : la feuille a fini de se refermer après une confirmation. C'est le bon moment pour annoncer le résultat ;
   * plus tôt, VoiceOver, qui revient sur le bouton d'origine à la fermeture, couperait l'annonce.
   */
  onRefermee?: () => void;
  /** Bouton qui ne change rien, fond assombri, retour Android ou geste d'échappement de VoiceOver : on ne touche à rien */
  onFermer: () => void;
};

// Seul iOS dit quand la feuille a fini de se refermer : ailleurs, on attend la fin de sa glissade
const DUREE_FERMETURE = 450;

/**
 * Petite feuille qui monte du bas pour confirmer un geste qui compte (ne plus suivre, retirer un abonné, annuler une demande…),
 * comme Instagram ou TikTok : rien ne se défait sur un seul toucher. Avec un très grand texte, le haut de la feuille défile
 * et les deux boutons restent toujours à l'écran. Animations réduites dans les réglages : elle apparaît en fondu.
 */
export function FeuilleConfirmation({ visible, emoji, titre, detail, libelleConfirmer, libelleRester, indiceRester, onConfirmer, onRefermee, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const refTitre = useRef<Text>(null);
  // Confirmation touchée, feuille pas encore refermée
  const confirmee = useRef(false);
  const minuterieFermeture = useRef<ReturnType<typeof setTimeout> | null>(null);

  // VoiceOver commence par le titre (sinon il tombe sur le fond « Fermer »), une fois la feuille arrivée
  useEffect(() => {
    if (!visible) return;
    confirmee.current = false;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), animationsReduites ? 150 : 400);
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
    onRefermee?.();
  }

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
          <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
            {lierPonctuation(titre)}
          </Text>
          <Text className="mt-2 text-center font-texte text-base leading-6 text-gris">{lierPonctuation(detail)}</Text>
        </ScrollView>
        <View className="mt-5 gap-3 px-5">
          <Bouton libelle={libelleConfirmer} variante="encre" onPress={confirmer} />
          <Pressable
            accessibilityRole="button"
            accessibilityHint={indiceRester}
            onPress={onFermer}
            className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Text className="font-texte-gras text-base text-encre">{libelleRester}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
