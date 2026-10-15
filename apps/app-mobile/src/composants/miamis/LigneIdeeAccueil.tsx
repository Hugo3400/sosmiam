import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { NOMS_STATUTS_IDEE, TEXTES_IDEES } from "~/contenus/textes-idees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  idee: IdeeMiamis;
  rang: number;
  onVoter: (oui: boolean) => void;
};

export function LigneIdeeAccueil({ idee, rang, onVoter }: Props) {
  const router = useRouter();
  const statut = `${NOMS_STATUTS_IDEE[idee.statut]} · ${TEXTES_IDEES.commentaires(idee.commentaires)}`;
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border-2 border-encre bg-white py-2.5 pl-4 pr-2.5">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="w-5 font-titre text-xl text-gris">
        {rang}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rang}, ${idee.titre}, ${statut}`}
        onPress={() => {
          vibrerLegerement();
          router.push({ pathname: "/potes/miamis/idee/[id]", params: { id: idee.id } });
        }}
        className="flex-1 gap-0.5 active:opacity-70"
      >
        <Text numberOfLines={2} className="font-texte-semi text-sm leading-5 text-encre">
          {idee.titre}
        </Text>
        <Text numberOfLines={1} className="font-texte text-xs text-gris">
          {statut}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={idee.aVote ? TEXTES_IDEES.retirerVote(idee.titre) : TEXTES_IDEES.voter(idee.titre)}
        accessibilityValue={{ text: TEXTES_IDEES.votesLus(idee.votes) }}
        accessibilityState={{ selected: idee.aVote }}
        onPress={() => {
          vibrerLegerement();
          onVoter(!idee.aVote);
        }}
        className={`min-h-12 min-w-14 items-center justify-center rounded-2xl border-2 px-2 active:opacity-80 ${idee.aVote ? "border-encre bg-jaune" : "border-ligne bg-creme"}`}
      >
        <Ionicons name="chevron-up" size={16} color={couleurs.encre} />
        <Text className="font-texte-gras text-[13px] text-encre">{idee.votes}</Text>
      </Pressable>
    </View>
  );
}
