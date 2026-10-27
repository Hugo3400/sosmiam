import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SignalementArticleActus } from "@sos-miam/commun/types/signalement";
import { SignalementPublication, type EtapeSignalement } from "~/composants/signalement/SignalementPublication";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { envoyerSignalementArticleActus } from "~/fonctions/signalement/envoyer-signalement-article-actus";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type CorpsSignalementActus = SignalementArticleActus extends infer S ? (S extends SignalementArticleActus ? Omit<S, "raison" | "precision" | "explication"> : never) : never;

export type ChoixSignalementActus = { cle: string; libelle: string; nomLieu: string; sousTitre: string; corps: CorpsSignalementActus };

type Props = { visible: boolean; choix: readonly ChoixSignalementActus[]; onFermer: () => void };

export function FeuilleSignalerArticle({ visible, choix, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article.signaler;
  const marges = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [choisie, setChoisie] = useState<ChoixSignalementActus | null>(null);
  const [etape, setEtape] = useState<EtapeSignalement>("raison");
  const cible = choix.length === 1 ? choix[0]! : choisie;

  const fermer = () => {
    setChoisie(null);
    setEtape("raison");
    onFermer();
  };
  utiliserInscriptionFeuille(visible, fermer);

  const choisir = (c: ChoixSignalementActus) => {
    vibrerLegerement();
    setChoisie(c);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={fermer}>
      <View className="flex-1 justify-end">
        <Pressable accessibilityRole="button" accessibilityLabel={T.fermer} onPress={fermer} style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ maxHeight: height * 0.88, paddingBottom: marges.bottom + 12 }} className="rounded-t-3xl border-t-2 border-encre bg-creme px-5 pt-5">
            <ScrollView keyboardShouldPersistTaps="handled">
              {cible === null ? (
                <View className="gap-3 pb-2">
                  <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
                    {T.quoi}
                  </Text>
                  {choix.map((c) => (
                    <Pressable
                      key={c.cle}
                      accessibilityRole="button"
                      onPress={() => choisir(c)}
                      className="min-h-14 justify-center rounded-carte border-2 border-encre bg-carte px-4 active:opacity-80"
                    >
                      <Text className="font-texte-gras text-base text-encre">{c.libelle}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <SignalementPublication
                  nomLieu={cible.nomLieu}
                  sousTitre={cible.sousTitre}
                  etape={etape}
                  onChangerEtape={setEtape}
                  onEnvoyer={(raison) => void envoyerSignalementArticleActus({ ...cible.corps, ...raison } as SignalementArticleActus).catch(() => false)}
                  onRetourMenu={() => (choix.length > 1 ? setChoisie(null) : fermer())}
                  onFermer={fermer}
                />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
