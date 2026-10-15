import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  idee: IdeeMiamis;
  onVoter: (oui: boolean) => void;
  grand?: boolean;
  occupe?: boolean;
};

export function BoutonMiamIdee({ idee, onVoter, grand = false, occupe = false }: Props) {
  const libelle = `${idee.aVote ? TEXTES_IDEES.retirerVote(idee.titre) : TEXTES_IDEES.voter(idee.titre)}, ${TEXTES_IDEES.votesLus(idee.votes)}`;
  const fond = idee.aVote ? "border-2 border-encre bg-jaune" : grand ? "border-2 border-encre bg-creme" : "border border-ligne bg-creme";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ selected: idee.aVote, busy: occupe }}
      hitSlop={4}
      onPress={() => {
        if (occupe) return;
        vibrerLegerement();
        onVoter(!idee.aVote);
      }}
      className={`items-center justify-center rounded-2xl active:scale-95 ${fond} ${grand ? "h-[52px] flex-row gap-1.5 px-4" : "h-[76px] w-[62px]"}`}
    >
      <Ionicons name="chevron-up" size={grand ? 20 : 18} color={couleurs.encre} />
      {grand ? (
        <Text className="font-texte-gras text-base text-encre" style={{ fontVariant: ["tabular-nums"] }}>
          {`${TEXTES_IDEES.miam} ${idee.votes}`}
        </Text>
      ) : (
        <>
          <Text className="font-texte-gras text-[15px] text-encre" style={{ fontVariant: ["tabular-nums"] }}>
            {idee.votes}
          </Text>
          <Text className="font-texte-semi text-[10px] text-encre">{TEXTES_IDEES.miam}</Text>
        </>
      )}
    </Pressable>
  );
}
