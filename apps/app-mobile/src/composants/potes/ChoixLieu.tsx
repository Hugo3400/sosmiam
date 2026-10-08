import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  titre: string;
  /** Lieux déjà choisis : affichés comme tels, et ne se choisissent pas deux fois */
  dejaChoisis?: number[];
  /** Règle en plus (ex. pas de bar dans une sortie avec un mineur) ; les bars sont déjà retirés sous 18 ans */
  permis?: (lieu: Lieu) => boolean;
  onChoisir: (lieuId: number) => void;
  onFermer: () => void;
};

/** Choisir un lieu dans une feuille qui monte du bas, avec une recherche (nom, plat, quartier, ville). */
export function ChoixLieu({ visible, titre, dejaChoisis = [], permis, onChoisir, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  // Animations réduites demandées sur le téléphone : la feuille apparaît en fondu au lieu de monter
  const animationsReduites = useReducedMotion();
  const { height } = useWindowDimensions();
  const { profil } = utiliserProfil();
  const [texte, setTexte] = useState("");
  const age = profil ? calculerAge(profil.dateNaissance) : null;

  const lieux = useMemo(() => {
    const mots = normaliserRecherche(texte).split(" ").filter(Boolean);
    return filtrerLieuxSelonAge(lieuxExemples, age)
      .filter((l) => !permis || permis(l))
      .filter((l) => mots.every((mot) => normaliserRecherche([l.nom, l.info, l.plat, l.quartier, l.ville].join(" ")).includes(mot)));
  }, [texte, age, permis]);

  // Un clavier resté ouvert derrière (titre d'une sortie, message) cacherait le bas de la liste : on le range à l'ouverture
  useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          // VoiceOver ne voit que la feuille : le geste d'échappement (Z à deux doigts) la referme, en plus du bouton « Fermer sans choisir »
          onAccessibilityEscape={onFermer}
          style={{ maxHeight: height * 0.85, paddingBottom: marges.bottom + 8, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <View className="gap-3 px-5 pb-3">
            <View className="flex-row items-center gap-2">
              <Text accessibilityRole="header" className="flex-1 font-titre text-2xl text-encre">
                {titre}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer sans choisir"
                onPress={onFermer}
                className="-mr-2 h-11 w-11 items-center justify-center rounded-full active:opacity-60"
              >
                <Ionicons name="close" size={24} color={couleurs.encre} />
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Chercher un lieu"
              value={texte}
              onChangeText={setTexte}
              placeholder="Un lieu, un plat, un quartier…"
              placeholderTextColor={couleurs.gris}
              autoCorrect={false}
              returnKeyType="search"
              className="min-h-12 rounded-full border-2 border-encre bg-white px-4 font-texte text-base text-encre"
            />
          </View>
          <FlatList
            data={lieux}
            keyExtractor={(l) => String(l.id)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerClassName="px-5"
            ListEmptyComponent={<Text className="py-6 text-center font-texte text-base text-gris">Aucun lieu ne correspond, essaie un autre mot.</Text>}
            renderItem={({ item }) => {
              const deja = dejaChoisis.includes(item.id);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nom}, ${item.info}, ${item.quartier}, ${item.ville}`}
                  accessibilityState={{ disabled: deja }}
                  accessibilityHint={deja ? "Déjà choisi" : undefined}
                  disabled={deja}
                  onPress={() => {
                    vibrerLegerement();
                    onChoisir(item.id);
                  }}
                  className={`min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70 ${deja ? "opacity-40" : ""}`}
                >
                  <View style={{ backgroundColor: item.couleurs[0] }} className="h-10 w-10 items-center justify-center rounded-xl">
                    <Text className="text-xl">{item.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                      {item.nom}
                    </Text>
                    <Text numberOfLines={1} className="font-texte text-sm text-gris">
                      {item.info} · {item.quartier}, {item.ville}
                    </Text>
                  </View>
                  {deja ? <Text className="font-texte-semi text-xs text-gris">Déjà choisi</Text> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
