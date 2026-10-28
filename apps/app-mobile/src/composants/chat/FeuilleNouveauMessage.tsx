import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { FlatList, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_CHAT_LISTE_PAR_LANGUE } from "~/contenus/textes-chat-liste";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  onFermer: () => void;
};

/** « Nouveau message » : une feuille qui monte du bas avec ta bande. Toucher un pote ouvre (ou crée) votre conversation privée. */
export function FeuilleNouveauMessage({ visible, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_CHAT_LISTE_PAR_LANGUE);
  const T_MESSAGES = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  const router = useRouter();
  const marges = useSafeAreaInsets();
  utiliserInscriptionFeuille(visible, onFermer);
  const geste = utiliserGlisserPourFermer(visible, onFermer);
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { potes } = utiliserCommunaute();
  const { ouvrirPrive } = utiliserConversations();

  function aller(chemin: "/potes/nouveau-groupe" | "/potes/ajouter") {
    vibrerLegerement();
    onFermer();
    router.push(chemin);
  }

  async function ecrire(poteId: string) {
    const id = await ouvrirPrive(poteId);
    if (!id) return;
    vibrerLegerement();
    onFermer();
    router.push({ pathname: "/potes/discussion/[id]", params: { id } });
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <Pressable accessibilityRole="button" accessibilityLabel={T.fermer} onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <Animated.View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        onLayout={geste.mesurerFeuille}
        style={[{ maxHeight: hauteurEcran * 0.85, flexShrink: 1 }, geste.styleFeuille]}
      >
        <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
          <PoigneeFeuille geste={geste} className="px-5 pb-2">
            <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
              {T_MESSAGES.nouveauMessage}
            </Text>
            <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.aQuiTuEcris)}</Text>
          </PoigneeFeuille>

          <FlatList
            data={potes}
            keyExtractor={(pote) => pote.id}
            contentContainerClassName="px-5"
            ListHeaderComponent={
              potes.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={T_MESSAGES.nouveauGroupe}
                  accessibilityHint={T_MESSAGES.indiceNouveauGroupe}
                  onPress={() => aller("/potes/nouveau-groupe")}
                  className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-jaune">
                    <Ionicons name="people" size={20} color={couleurs.nuit} />
                  </View>
                  <Text className="flex-1 font-texte-gras text-base text-encre">{T_MESSAGES.nouveauGroupe}</Text>
                  <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
                <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.bandeVide)}</Text>
                <Bouton libelle={T.ajouterPote} variante="blanc" petit onPress={() => aller("/potes/ajouter")} />
              </View>
            }
            renderItem={({ item: pote }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${pote.prenom}, @${pote.pseudo}`}
                accessibilityHint={T.ouvrePrive}
                onPress={() => void ecrire(pote.id)}
                className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70"
              >
                <RondPote pote={pote} taille={40} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                    {pote.prenom}
                  </Text>
                  <Text numberOfLines={1} className="font-texte text-sm text-gris">
                    {[`@${pote.pseudo}`, pote.ville.trim()].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
              </Pressable>
            )}
            ListFooterComponent={
              <Pressable accessibilityRole="button" onPress={onFermer} className="mt-4 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80">
                <Text className="font-texte-gras text-base text-encre">{T.annuler}</Text>
              </Pressable>
            }
          />
        </View>
      </Animated.View>
    </Modal>
  );
}
