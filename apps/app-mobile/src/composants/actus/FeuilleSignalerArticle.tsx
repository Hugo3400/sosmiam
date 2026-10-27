import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ReponseLieuActus } from "@sos-miam/commun/types/actus";
import { SignalementPublication, type EtapeSignalement } from "~/composants/signalement/SignalementPublication";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { envoyerSignalementArticleActus } from "~/fonctions/signalement/envoyer-signalement-article-actus";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Cible = { quoi: "article" } | { quoi: "reponse"; reponse: ReponseLieuActus };

type Props = { visible: boolean; articleId: number; titre: string; nomLieu: string; reponses: readonly ReponseLieuActus[]; onFermer: () => void };

export function FeuilleSignalerArticle({ visible, articleId, titre, nomLieu, reponses, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article.signaler;
  const marges = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [choisie, setChoisie] = useState<Cible | null>(null);
  const [etape, setEtape] = useState<EtapeSignalement>("raison");
  const cible: Cible | null = reponses.length === 0 ? { quoi: "article" } : choisie;

  const fermer = () => {
    setChoisie(null);
    setEtape("raison");
    onFermer();
  };
  utiliserInscriptionFeuille(visible, fermer);

  const choisir = (c: Cible) => {
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
                  {[{ quoi: "article" as const }, ...reponses.map((reponse) => ({ quoi: "reponse" as const, reponse }))].map((c) => (
                    <Pressable
                      key={c.quoi === "article" ? "article" : c.reponse.lieuId}
                      accessibilityRole="button"
                      onPress={() => choisir(c)}
                      className="min-h-14 justify-center rounded-carte border-2 border-encre bg-carte px-4 active:opacity-80"
                    >
                      <Text className="font-texte-gras text-base text-encre">{c.quoi === "article" ? T.article : T.reponse(c.reponse.nomLieu)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <SignalementPublication
                  nomLieu={cible.quoi === "article" ? nomLieu : cible.reponse.nomLieu}
                  sousTitre={cible.quoi === "article" ? T.sousTitre(titre) : T.sousTitreReponse(cible.reponse.nomLieu)}
                  etape={etape}
                  onChangerEtape={setEtape}
                  onEnvoyer={(choix) =>
                    void envoyerSignalementArticleActus(
                      cible.quoi === "article" ? { cible: "article-actu", articleId, ...choix } : { cible: "reponse-actu", articleId, lieuId: cible.reponse.lieuId, ...choix },
                    ).catch(() => false)
                  }
                  onRetourMenu={() => (reponses.length > 0 ? setChoisie(null) : fermer())}
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
