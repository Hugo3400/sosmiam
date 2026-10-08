import { useEffect, useRef } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { raisonsCompte } from "~/contenus/raisons-compte";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";

type Props = {
  visible: boolean;
  /** Le geste qui demande un compte : il donne l'emoji, le titre et la phrase */
  raison: RaisonCompte;
  /** « Plus tard », fond assombri, retour Android ou geste d'échappement de VoiceOver (et aussi « Je m'inscris », qui ferme d'abord) */
  onFermer: () => void;
  /**
   * « Je m'inscris » touché, et la feuille a fini de se refermer : c'est le moment d'ouvrir l'inscription. Plus tôt,
   * VoiceOver, qui revient sur le bouton d'origine à la fermeture, quitterait l'écran d'inscription.
   */
  onInscrire: () => void;
};

/** Ce qu'un compte apporte, en trois mots (les mêmes pour tous les gestes) */
const AVANTAGES = [
  { emoji: "🛟", texte: "Sauve des lieux et gagne des points" },
  { emoji: "👯", texte: "Retrouve tes potes et organisez vos sorties" },
  { emoji: "📌", texte: "Garde tes lieux préférés et donne ton avis" },
] as const;

// Seul iOS dit quand la feuille a fini de se refermer : ailleurs, on attend la fin de sa glissade
const DUREE_FERMETURE = 450;
// Sur iOS, au cas où la fin de fermeture ne viendrait pas : on ouvre l'inscription quand même
const SECOURS_IOS = 1000;

/**
 * Petite feuille qui monte du bas quand on touche un geste réservé aux inscrits pendant la visite sans compte :
 * « Crée ton compte pour … », trois avantages, « Je m'inscris (1 min) » ou « Plus tard ». Avec un très grand texte,
 * le haut de la feuille défile et les deux boutons restent toujours à l'écran.
 */
export function FeuilleCreerCompte({ visible, raison, onFermer, onInscrire }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const titre = useRef<Text>(null);
  // « Je m'inscris » touché, feuille pas encore refermée
  const inscription = useRef(false);
  const minuterieFermeture = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { emoji, titre: texteTitre, phrase } = raisonsCompte[raison];

  // VoiceOver commence par le titre (sinon il tombe sur le fond « Fermer »), une fois la feuille arrivée
  useEffect(() => {
    if (!visible) return;
    inscription.current = false;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(titre.current), animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [visible, animationsReduites]);

  useEffect(
    () => () => {
      if (minuterieFermeture.current) clearTimeout(minuterieFermeture.current);
    },
    [],
  );

  function inscrire() {
    if (inscription.current) return;
    inscription.current = true;
    onFermer();
    minuterieFermeture.current = setTimeout(finirFermeture, Platform.OS === "ios" ? SECOURS_IOS : DUREE_FERMETURE);
  }

  function finirFermeture() {
    if (minuterieFermeture.current) clearTimeout(minuterieFermeture.current);
    minuterieFermeture.current = null;
    if (!inscription.current) return;
    inscription.current = false;
    onInscrire();
  }

  // Animations réduites dans les réglages : la feuille apparaît en fondu au lieu de monter du bas
  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer} onDismiss={finirFermeture}>
      {/* Le fond garde au moins la hauteur de la barre d'état : la feuille ne passe jamais dessous */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer, et continuer sans compte"
        onPress={onFermer}
        style={{ minHeight: marges.top }}
        className="flex-1 bg-black/40"
      />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
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
            {lierPonctuation(texteTitre)}
          </Text>
          <Text className="mt-2 text-center font-texte text-base leading-6 text-gris">{lierPonctuation(phrase)}</Text>
          <View className="mt-5 gap-2 rounded-carte border-2 border-encre bg-white p-4">
            {AVANTAGES.map((avantage) => (
              <View key={avantage.texte} accessible accessibilityLabel={avantage.texte} className="flex-row items-center gap-3">
                <Text className="text-xl">{avantage.emoji}</Text>
                <Text className="flex-1 font-texte-semi text-[15px] leading-[22px] text-encre">{avantage.texte}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View className="mt-5 gap-3 px-5">
          <Bouton libelle="Je m'inscris (1 min)" variante="encre" indice="Ouvre l'inscription : Apple, Google ou ton e-mail" onPress={inscrire} />
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Tu continues ta visite sans compte"
            onPress={onFermer}
            className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Text className="font-texte-gras text-base text-encre">Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
