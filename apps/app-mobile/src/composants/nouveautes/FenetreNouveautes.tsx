import { useEffect, useRef } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { NOUVEAUTES_VERSIONS_PAR_LANGUE, type NouveautesVersion } from "~/contenus/nouveautes-versions";
import { TEXTES_NOUVEAUTES_PAR_LANGUE } from "~/contenus/textes-nouveautes";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nouveautes: NouveautesVersion | null;
  visible: boolean;
  onVoir: () => void;
  onFermer: () => void;
  onMontree?: () => void;
};

const DELAI_FOCUS_TITRE = 700;
const POINTS_MAX = 4;

export function FenetreNouveautes({ nouveautes: recues, visible, onVoir, onFermer, onMontree }: Props) {
  const T = utiliserTextes(TEXTES_NOUVEAUTES_PAR_LANGUE).fenetre;
  const versions = utiliserTextes(NOUVEAUTES_VERSIONS_PAR_LANGUE);
  const nouveautes = recues ? (versions.find((v) => v.version === recues.version) ?? recues) : null;
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const refTitre = useRef<Text>(null);
  const ouverte = visible && nouveautes !== null;
  utiliserInscriptionFeuille(ouverte, onFermer);

  useEffect(() => {
    if (!ouverte || !nouveautes) return;
    annoncerLecteurEcran(T.annonceLecteurEcran(nouveautes.libelle));
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_TITRE);
    return () => clearTimeout(minuterie);
  }, [ouverte, nouveautes, T]);

  if (!nouveautes) return null;

  return (
    <Modal visible={ouverte} transparent animationType="fade" onRequestClose={onFermer} onShow={onMontree} aria-label={nouveautes.titre}>
      <View style={{ paddingTop: marges.top + 16, paddingBottom: marges.bottom + 16 }} className="flex-1 items-center justify-center px-4">
        <Pressable accessibilityRole="button" accessibilityLabel={T.fermerFond} onPress={onFermer} style={{ position: "absolute", inset: 0 }} className="bg-black/50" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          style={{ maxHeight: hauteurEcran - marges.top - marges.bottom - 32 }}
          className="w-full max-w-[420px] overflow-hidden rounded-carte border-2 border-encre bg-creme"
        >
          <ScrollView style={{ flexGrow: 0 }} bounces={false} contentContainerClassName="items-center gap-3 px-5 pb-1 pt-6">
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="h-24 w-24 items-center justify-center rounded-full border-2 border-encre bg-jaune">
              <Text className="text-5xl leading-[60px]">🎉</Text>
            </View>
            <Text className="font-texte-gras text-xs uppercase tracking-widest text-gris">{T.surtitre(nouveautes.libelle)}</Text>
            <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl leading-8 text-encre">
              {lierPonctuation(nouveautes.titre)}
            </Text>
            <View className="mt-1 w-full gap-3">
              {nouveautes.points.slice(0, POINTS_MAX).map((point) => (
                <View key={point.titre} accessible className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-jaune-clair">
                    <Text className="text-lg">{point.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(point.titre)}</Text>
                    <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(point.detail)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          <View className="gap-3 px-5 pb-5 pt-4">
            <Bouton libelle={T.voir} variante="jaune" indice={T.indiceVoir} onPress={onVoir} />
            <Bouton libelle={T.fermer} variante="blanc" indice={T.indiceFermer} onPress={onFermer} />
            <Text className="text-center font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.rappel)}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
