import { Ionicons } from "@expo/vector-icons";
import { Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  /** Villes proposées */
  villes: string[];
  /** Ville choisie, ou null pour toutes */
  ville: string | null;
  onChoisir: (ville: string | null) => void;
  onFermer: () => void;
};

/** Petite feuille qui monte du bas pour choisir la ville d'Explorer : « Toutes les villes » ou une seule. Un choix la referme. */
export function ChoixVilleExplorer({ visible, villes, ville, onChoisir, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  // Une ville choisie qui n'est plus dans la liste reste proposée : on peut toujours la voir cochée
  const proposees = ville && !villes.includes(ville) ? [ville, ...villes] : villes;
  const choix: { cle: string; valeur: string | null; libelle: string }[] = [
    { cle: "toutes", valeur: null, libelle: "Toutes les villes" },
    ...proposees.map((v) => ({ cle: v, valeur: v, libelle: v })),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fermer le choix de ville" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onFermer}
        style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.7 }}
        className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
      >
        <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
        <Text accessibilityRole="header" className="mb-1 px-5 font-titre text-2xl text-encre">{lierPonctuation("On explore où ?")}</Text>
        <ScrollView contentContainerClassName="px-5" accessibilityRole="radiogroup">
          {choix.map((c) => {
            const choisi = c.valeur === ville;
            return (
              <Pressable
                key={c.cle}
                accessibilityRole="radio"
                // Comme Pastille : « selected » sur iPhone (l'état « checked » d'une radio y est lu en anglais), « checked » ailleurs
                accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
                accessibilityLabel={c.libelle}
                onPress={() => {
                  vibrerLegerement();
                  onChoisir(c.valeur);
                }}
                className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-3 active:opacity-70"
              >
                <Text className="text-xl">{c.valeur ? "📍" : "🗺️"}</Text>
                <Text className={`flex-1 text-base text-encre ${choisi ? "font-texte-gras" : "font-texte"}`}>{c.libelle}</Text>
                {choisi ? <Ionicons name="checkmark-circle" size={24} color={couleurs.encre} /> : <View className="h-6 w-6 rounded-full border-2 border-ligne" />}
              </Pressable>
            );
          })}
        </ScrollView>
        <View className="px-5">
          <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
            <Text className="font-texte-gras text-base text-encre">Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
