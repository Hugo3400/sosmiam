import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  onFermer: () => void;
};

const POURQUOI = "Ajoutez-vous en vrai, par lien ou QR code, pour discuter : règle des 15-17 ans.";

/**
 * « Nouveau message » : une feuille qui monte du bas avec ta bande. Toucher un pote ouvre (ou crée) votre conversation privée.
 * Les potes avec qui tu ne peux pas encore discuter (protection des 15-17 ans) sont grisés, avec le pourquoi.
 */
export function FeuilleNouveauMessage({ visible, onFermer }: Props) {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { potes } = utiliserCommunaute();
  const { peutDiscuterAvec, ouvrirPrive } = utiliserConversations();

  // Ceux avec qui tu peux discuter d'abord, les autres ensuite
  const tous = potes.map((p) => ({ pote: p, permis: peutDiscuterAvec(p.id) }));
  const lignes = [...tous.filter((l) => l.permis), ...tous.filter((l) => !l.permis)];

  function aller(chemin: "/potes/nouveau-groupe" | "/potes/ajouter") {
    vibrerLegerement();
    onFermer();
    router.push(chemin);
  }

  function ecrire(poteId: string) {
    const id = ouvrirPrive(poteId);
    if (!id) return;
    vibrerLegerement();
    onFermer();
    router.push({ pathname: "/potes/discussion/[id]", params: { id } });
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.85, flexShrink: 1 }}
        className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
      >
        <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
        <View className="px-5 pb-2">
          <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
            Nouveau message
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("À qui tu écris ? Un « t'as faim ? » suffit pour commencer.")}</Text>
        </View>

        <FlatList
          data={lignes}
          keyExtractor={(l) => l.pote.id}
          contentContainerClassName="px-5"
          ListHeaderComponent={
            potes.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nouveau groupe"
                accessibilityHint="Pour discuter à plusieurs"
                onPress={() => aller("/potes/nouveau-groupe")}
                className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-jaune">
                  <Ionicons name="people" size={20} color={couleurs.encre} />
                </View>
                <Text className="flex-1 font-texte-gras text-base text-encre">Nouveau groupe</Text>
                <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
              <Text className="text-center font-texte text-base leading-6 text-gris">
                {lierPonctuation("Ta bande est vide pour l'instant : ajoute un pote, et vous pourrez papoter.")}
              </Text>
              <Bouton libelle="Ajouter un pote" variante="blanc" petit onPress={() => aller("/potes/ajouter")} />
            </View>
          }
          renderItem={({ item: { pote, permis } }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={permis ? `${pote.prenom}, @${pote.pseudo}` : `${pote.prenom}. Pas encore possible. ${POURQUOI}`}
              accessibilityHint={permis ? "Ouvre votre conversation privée" : undefined}
              accessibilityState={{ disabled: !permis }}
              disabled={!permis}
              onPress={() => ecrire(pote.id)}
              className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70"
            >
              <View className={permis ? "" : "opacity-40"}>
                <RondPote pote={pote} taille={40} />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className={`font-texte-gras text-base ${permis ? "text-encre" : "text-gris"}`}>
                  {pote.prenom}
                </Text>
                {permis ? (
                  <Text numberOfLines={1} className="font-texte text-sm text-gris">
                    @{pote.pseudo} · {pote.ville}
                  </Text>
                ) : (
                  <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(`🔐 ${POURQUOI}`)}</Text>
                )}
              </View>
              {permis ? <Ionicons name="chevron-forward" size={18} color={couleurs.gris} /> : null}
            </Pressable>
          )}
          ListFooterComponent={
            <Pressable accessibilityRole="button" onPress={onFermer} className="mt-4 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
              <Text className="font-texte-gras text-base text-encre">Annuler</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
  );
}
