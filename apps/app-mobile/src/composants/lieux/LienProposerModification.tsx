import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import couleurs from "~/theme/couleurs";

/**
 * Bas de la fiche : « Une info a changé ? Propose une modification ». Ouvre le formulaire (un compte est demandé : l'équipe
 * doit pouvoir répondre et éviter les abus). L'équipe relit chaque proposition avant de toucher à la fiche.
 */
export function LienProposerModification({ lieu }: { lieu: Pick<Lieu, "id" | "nom"> }) {
  const router = useRouter();
  const exigerCompte = utiliserCompteRequis();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Une info a changé ? Propose une modification de la fiche`}
      accessibilityHint="L'équipe relit ta proposition avant de changer la fiche"
      onPress={() => {
        vibrerLegerement();
        if (exigerCompte("proposer")) router.push({ pathname: "/lieu/[id]/proposer", params: { id: String(lieu.id) } });
      }}
      className="min-h-14 flex-row items-center gap-3 rounded-carte border-2 border-dashed border-gris/50 bg-white/60 px-4 py-3 active:opacity-70"
    >
      <Text className="text-xl">✏️</Text>
      <View className="flex-1">
        <Text className="font-texte-gras text-[15px] text-encre">Une info a changé ?</Text>
        <Text className="font-texte text-[13px] text-gris">Propose une modification, l'équipe vérifie</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}
