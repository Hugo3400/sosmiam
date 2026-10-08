import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Le pote qui t'a envoyé le lieu ; null : menu fermé */
  pote: Pote | null;
  onFermer: () => void;
};

type Vue = "options" | "signaler" | "bloquer";

/** Le menu « ⋯ » d'un lieu reçu : voir le profil du pote, le signaler ou le bloquer (ses lieux envoyés disparaissent alors pour toi). */
export function MenuPoteRecommandation({ pote, onFermer }: Props) {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  // Animations réduites demandées sur le téléphone : la feuille apparaît en fondu au lieu de monter
  const animationsReduites = useReducedMotion();
  const { height: hauteurEcran } = useWindowDimensions();
  const { bloquer } = utiliserCommunaute();
  const [vue, setVue] = useState<Vue>("options");
  // Le pote affiché reste celui de l'ouverture pendant que la feuille redescend
  const [affiche, setAffiche] = useState<Pote | null>(pote);
  if (pote && pote !== affiche) setAffiche(pote);
  // À chaque ouverture, on repart des options (sans montrer l'ancienne vue le temps d'un rendu)
  const [ouvert, setOuvert] = useState(pote !== null);
  if ((pote !== null) !== ouvert) {
    setOuvert(pote !== null);
    if (pote) setVue("options");
  }

  // Retour Android et geste d'échappement de VoiceOver : une vue en arrière
  const reculer = () => (vue === "options" ? onFermer() : setVue("options"));

  const options = affiche
    ? [
        { cle: "profil" as const, emoji: "👀", titre: `Voir le profil de ${affiche.prenom}`, detail: `@${affiche.pseudo}` },
        { cle: "signaler" as const, emoji: "🚩", titre: `Signaler ${affiche.prenom}`, detail: "Arnaque, propos haineux, contenu choquant…" },
        { cle: "bloquer" as const, emoji: "🚫", titre: `Bloquer ${affiche.prenom}`, detail: "Ses messages et ses lieux envoyés disparaissent pour toi" },
      ]
    : [];

  return (
    <Modal visible={pote !== null} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le menu" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
            {!affiche ? null : vue === "signaler" ? (
              <SignalerContenu cible="profil" cibleId={affiche.id} sujet={`le profil de ${affiche.prenom}`} onTermine={onFermer} />
            ) : vue === "bloquer" ? (
              <View className="gap-3">
                <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
                  {lierPonctuation(`Bloquer ${affiche.prenom} ?`)}
                </Text>
                <Text className="font-texte text-base leading-6 text-encre">
                  {lierPonctuation(`${affiche.prenom} sort de ta bande, et tu ne verras plus ses messages, ses commentaires ni ses lieux envoyés.`)}
                </Text>
                <Bouton
                  libelle={`Bloquer ${affiche.prenom}`}
                  variante="encre"
                  onPress={() => {
                    bloquer(affiche.id);
                    onFermer();
                  }}
                  className="mt-2"
                />
                <Bouton libelle="Annuler" variante="blanc" onPress={() => setVue("options")} />
              </View>
            ) : (
              <>
                <Text accessibilityRole="header" numberOfLines={1} className="mb-2 font-titre text-2xl text-encre">
                  {affiche.prenom}
                </Text>
                {options.map((o) => (
                  <Pressable
                    key={o.cle}
                    accessibilityRole="button"
                    accessibilityLabel={o.titre}
                    accessibilityHint={o.detail}
                    onPress={() => {
                      vibrerLegerement();
                      if (o.cle === "profil") {
                        onFermer();
                        router.push({ pathname: "/potes/profil/[id]", params: { id: affiche.id } });
                      } else setVue(o.cle);
                    }}
                    className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
                  >
                    <Text className="text-2xl">{o.emoji}</Text>
                    <View className="flex-1">
                      <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
                      <Text className="font-texte text-sm text-gris">{o.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
                  </Pressable>
                ))}
                <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
                  <Text className="font-texte-gras text-base text-encre">Annuler</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
