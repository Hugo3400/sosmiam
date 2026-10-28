import { useCallback, useEffect, useRef } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_MISE_A_JOUR_PAR_LANGUE } from "~/contenus/textes-mise-a-jour";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserOuvertureStore } from "~/hooks/utiliser-ouverture-store";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  onFermer: () => void;
  onMontree?: () => void;
};

const DELAI_FOCUS_TITRE = 700;

export function FenetreNouvelleVersion({ visible, onFermer, onMontree }: Props) {
  const marges = useSafeAreaInsets();
  const T = utiliserTextes(TEXTES_MISE_A_JOUR_PAR_LANGUE).nouvelle;
  const { height: hauteurEcran } = useWindowDimensions();
  const refTitre = useRef<Text>(null);
  const { ouvrir, erreur, oublierErreur, indice } = utiliserOuvertureStore();

  const fermer = useCallback(() => {
    oublierErreur();
    onFermer();
  }, [oublierErreur, onFermer]);
  utiliserInscriptionFeuille(visible, fermer);

  useEffect(() => {
    if (!visible) return;
    annoncerLecteurEcran(T.annonceLecteurEcran);
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_TITRE);
    return () => clearTimeout(minuterie);
  }, [visible, T.annonceLecteurEcran]);

  async function mettreAJour() {
    if (await ouvrir()) fermer();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer} onShow={onMontree} aria-label={T.titre}>
      <View style={{ paddingTop: marges.top + 16, paddingBottom: marges.bottom + 16 }} className="flex-1 items-center justify-center px-4">
        <Pressable accessibilityRole="button" accessibilityLabel={T.fermerFond} onPress={fermer} style={{ position: "absolute", inset: 0 }} className="bg-black/50" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={fermer}
          style={{ maxHeight: hauteurEcran - marges.top - marges.bottom - 32 }}
          className="w-full max-w-[420px] overflow-hidden rounded-carte border-2 border-encre bg-creme"
        >
          <ScrollView style={{ flexGrow: 0 }} bounces={false} contentContainerClassName="items-center gap-3 px-5 pb-1 pt-6">
            <Mascotte expression="clin" taille={100} />
            <Text className="font-texte-gras text-xs uppercase tracking-widest text-gris">{T.surtitre}</Text>
            <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl leading-8 text-encre">
              {lierPonctuation(T.titre)}
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-encre">{lierPonctuation(T.texte)}</Text>
            {erreur ? (
              <Text accessibilityLiveRegion="polite" className="text-center font-texte-semi text-sm leading-5 text-rouge-texte">
                {erreur}
              </Text>
            ) : null}
          </ScrollView>
          <View className="gap-3 px-5 pb-5 pt-4">
            <Bouton libelle={T.bouton} variante="jaune" indice={indice} onPress={() => void mettreAJour()} />
            <Bouton libelle={T.plusTard} variante="blanc" indice={T.indicePlusTard} onPress={fermer} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
