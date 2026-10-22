import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";

export type OptionMenu = {
  cle: string;
  emoji: string;
  titre: string;
  detail?: string;
  /** Un geste qui compte (quitter une sortie) : la feuille demande d'abord, avec ces mots */
  confirmation?: { titre: string; detail: string; confirmer: string; rester: string };
  /** Appelé une fois la feuille fermée par ce choix (après la confirmation s'il y en a une) */
  agir: () => void;
};

type Props = {
  visible: boolean;
  titre: string;
  options: OptionMenu[];
  /** Fond assombri, « Annuler », retour Android ou geste d'échappement de VoiceOver : rien ne change */
  onFermer: () => void;
};

/**
 * Le menu « ⋯ » d'un élément (une sortie, une ligne de l'activité…) : une feuille qui monte du bas avec ses choix ; un choix
 * qui compte passe d'abord par une confirmation, dans la même feuille. Comme le menu d'un lieu envoyé (MenuContenuPote).
 */
export function MenuOptions({ visible, titre, options, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const couleurs = utiliserCouleurs();
  utiliserInscriptionFeuille(visible, onFermer);
  const animationsReduites = useReducedMotion();
  const { height: hauteurEcran } = useWindowDimensions();
  const titreOptions = useRef<Text>(null);
  const titreConfirmation = useRef<Text>(null);
  const [aConfirmer, setAConfirmer] = useState<OptionMenu | null>(null);
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  // Le contenu reste celui de l'ouverture pendant que la feuille redescend
  const [affiche, setAffiche] = useState({ titre, options });
  if (visible && (affiche.titre !== titre || affiche.options !== options)) setAffiche({ titre, options });
  // À chaque ouverture, on repart des choix
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) setAConfirmer(null);
  }

  useEffect(() => {
    if (!visible) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran((aConfirmer ? titreConfirmation : titreOptions).current), aConfirmer ? 150 : animationsReduites ? 150 : 400);
    return () => clearTimeout(minuterie);
  }, [visible, aConfirmer, animationsReduites]);

  const choisir = (option: OptionMenu) => {
    vibrerLegerement();
    if (option.confirmation) return setAConfirmer(option);
    onFermer();
    option.agir();
  };
  const reculer = () => (aConfirmer ? setAConfirmer(null) : onFermer());

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <Animated.View
        accessibilityViewIsModal
        onAccessibilityEscape={reculer}
        onLayout={geste.mesurerFeuille}
        style={[{ maxHeight: hauteurEcran * 0.88, flexShrink: 1 }, geste.styleFeuille]}
      >
        <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
          <PoigneeFeuille geste={geste} className="px-5">
            {aConfirmer?.confirmation ? (
              <Text ref={titreConfirmation} accessibilityRole="header" className="mb-3 font-titre text-2xl text-encre">
                {lierPonctuation(aConfirmer.confirmation.titre)}
              </Text>
            ) : (
              <Text ref={titreOptions} accessibilityRole="header" accessibilityLabel={retirerEmoji(affiche.titre)} numberOfLines={2} className="mb-2 font-titre text-2xl text-encre">
                {lierPonctuation(affiche.titre)}
              </Text>
            )}
          </PoigneeFeuille>
          <ScrollView contentContainerClassName="px-5">
            {aConfirmer?.confirmation ? (
              <View className="gap-3">
                <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(aConfirmer.confirmation.detail)}</Text>
                <Bouton
                  libelle={aConfirmer.confirmation.confirmer}
                  variante="encre"
                  onPress={() => {
                    onFermer();
                    aConfirmer.agir();
                  }}
                  className="mt-2"
                />
                <Bouton libelle={aConfirmer.confirmation.rester} variante="blanc" onPress={() => setAConfirmer(null)} />
              </View>
            ) : (
              <>
                {affiche.options.map((o) => (
                  <Pressable
                    key={o.cle}
                    accessibilityRole="button"
                    accessibilityLabel={o.titre}
                    accessibilityHint={o.detail}
                    onPress={() => choisir(o)}
                    className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
                  >
                    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
                      {o.emoji}
                    </Text>
                    <View className="flex-1">
                      <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
                      {o.detail ? <Text className="font-texte text-sm text-gris">{o.detail}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
                  </Pressable>
                ))}
                <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
                  <Text className="font-texte-gras text-base text-encre">Annuler</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}
