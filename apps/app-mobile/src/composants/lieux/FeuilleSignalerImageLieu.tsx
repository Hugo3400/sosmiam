import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ImageLieu } from "@sos-miam/commun/regles/images-lieu";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { SignalementPublication, type EtapeSignalement } from "~/composants/signalement/SignalementPublication";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "~/contenus/textes-images-lieu";
import { envoyerSignalementImageLieu } from "~/fonctions/signalement/envoyer-signalement-image-lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { visible: boolean; lieu: Pick<Lieu, "id" | "nom">; quelles: readonly ImageLieu[]; onFermer: () => void };

export function FeuilleSignalerImageLieu({ visible, lieu, quelles, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE).signaler;
  const marges = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [choisie, setChoisie] = useState<ImageLieu | null>(null);
  const [etape, setEtape] = useState<EtapeSignalement>("raison");
  const quelle = quelles.length === 1 ? quelles[0]! : choisie;

  const fermer = () => {
    setChoisie(null);
    setEtape("raison");
    onFermer();
  };
  utiliserInscriptionFeuille(visible, fermer);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={fermer}>
      <View className="flex-1 justify-end">
        <Pressable accessibilityRole="button" accessibilityLabel={T.fermer} onPress={fermer} style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ maxHeight: height * 0.88, paddingBottom: marges.bottom + 12 }} className="rounded-t-3xl border-t-2 border-encre bg-creme px-5 pt-5">
            <ScrollView keyboardShouldPersistTaps="handled">
              {quelle === null ? (
                <View className="gap-3 pb-2">
                  <Text accessibilityRole="header" className="font-titre text-2xl text-encre">{T.quelle}</Text>
                  {quelles.map((q) => (
                    <Pressable
                      key={q}
                      accessibilityRole="button"
                      onPress={() => {
                        vibrerLegerement();
                        setChoisie(q);
                      }}
                      className="min-h-14 justify-center rounded-carte border-2 border-encre bg-carte px-4 active:opacity-80"
                    >
                      <Text className="font-texte-gras text-base text-encre">{q === "banniere" ? T.banniere : T.logo}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <SignalementPublication
                  nomLieu={lieu.nom}
                  sousTitre={T.sousTitre[quelle](lieu.nom)}
                  etape={etape}
                  onChangerEtape={setEtape}
                  onEnvoyer={(choix) => void envoyerSignalementImageLieu({ cible: "image-lieu", lieuId: lieu.id, quelle, ...choix }).catch(() => false)}
                  onRetourMenu={() => (quelles.length > 1 ? setChoisie(null) : fermer())}
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
