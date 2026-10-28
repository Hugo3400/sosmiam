import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/textes-fiche-lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Bas de la fiche : « Une info a changé ? Propose une modification ». Ouvre le formulaire (un compte est demandé : l'équipe
 * doit pouvoir répondre et éviter les abus). L'équipe relit chaque proposition avant de toucher à la fiche.
 */
export function LienProposerModification({ lieu }: { lieu: Pick<Lieu, "id" | "nom"> }) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const exigerCompte = utiliserCompteRequis();
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).modification;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={T.lu}
      accessibilityHint={T.indice}
      onPress={() => {
        vibrerLegerement();
        if (exigerCompte("proposer")) router.push({ pathname: "/lieu/[id]/proposer", params: { id: String(lieu.id) } });
      }}
      className="min-h-14 flex-row items-center gap-3 rounded-carte border-2 border-dashed border-gris/50 bg-carte/60 px-4 py-3 active:opacity-70"
    >
      <Text className="text-xl">✏️</Text>
      <View className="flex-1">
        <Text className="font-texte-gras text-[15px] text-encre">{T.titre}</Text>
        <Text className="font-texte text-[13px] text-gris">{T.texte}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}
