import { useEffect, useRef } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AnnonceApp } from "@sos-miam/commun/types/annonce-app";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ANNONCE_APP_PAR_LANGUE } from "~/contenus/textes-annonce-app";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  annonce: AnnonceApp | null;
  visible: boolean;
  bouton: { libelle: string; ouvrir: () => void } | null;
  onFermer: () => void;
  onMontree: () => void;
};

const DELAI_FOCUS_TITRE = 700;

export function FenetreAnnonceApp({ annonce, visible, bouton, onFermer, onMontree }: Props) {
  const marges = useSafeAreaInsets();
  const T = utiliserTextes(TEXTES_ANNONCE_APP_PAR_LANGUE);
  const { height: hauteurEcran } = useWindowDimensions();
  const refTitre = useRef<Text>(null);
  const ouverte = visible && annonce !== null;
  utiliserInscriptionFeuille(ouverte, onFermer);

  useEffect(() => {
    if (!ouverte) return;
    annoncerLecteurEcran(T.annonceLecteurEcran);
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_TITRE);
    return () => clearTimeout(minuterie);
  }, [ouverte, T.annonceLecteurEcran]);

  if (!annonce) return null;

  return (
    <Modal visible={ouverte} transparent animationType="fade" onRequestClose={onFermer} onShow={onMontree} aria-label={annonce.titre}>
      <View style={{ paddingTop: marges.top + 16, paddingBottom: marges.bottom + 16 }} className="flex-1 items-center justify-center px-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.fermerFond}
          onPress={onFermer}
          style={{ position: "absolute", inset: 0 }}
          className="bg-black/50"
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          style={{ maxHeight: hauteurEcran - marges.top - marges.bottom - 32 }}
          className="w-full max-w-[420px] overflow-hidden rounded-carte border-2 border-encre bg-creme"
        >
          <ScrollView style={{ flexGrow: 0 }} bounces={false} contentContainerClassName="items-center gap-3 px-5 pb-1 pt-6">
            {annonce.emoji ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="h-24 w-24 items-center justify-center rounded-full border-2 border-encre bg-jaune"
              >
                <Text className="text-5xl leading-[60px]">{annonce.emoji}</Text>
              </View>
            ) : null}
            <Text className="font-texte-gras text-xs uppercase tracking-widest text-gris">{T.surtitre}</Text>
            <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl leading-8 text-encre">
              {lierPonctuation(annonce.titre)}
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-encre">{lierPonctuation(annonce.texte)}</Text>
          </ScrollView>
          <View className="gap-3 px-5 pb-5 pt-4">
            {bouton ? (
              <Bouton libelle={lierPonctuation(bouton.libelle)} variante="jaune" indice={T.indiceBouton} onPress={bouton.ouvrir} />
            ) : null}
            <Bouton libelle={T.compris} variante={bouton ? "blanc" : "encre"} onPress={onFermer} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
