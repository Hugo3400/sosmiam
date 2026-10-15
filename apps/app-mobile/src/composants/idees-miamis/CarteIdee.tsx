import { Pressable, Text, View } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { AuteurIdee } from "~/composants/idees-miamis/AuteurIdee";
import { BoutonMiamIdee } from "~/composants/idees-miamis/BoutonMiamIdee";
import { PastilleStatutIdee } from "~/composants/idees-miamis/PastilleStatutIdee";
import { TEXTES_IDEES } from "~/contenus/textes-idees";

type Props = {
  idee: IdeeMiamis;
  monId: string;
  occupe: boolean;
  onVoter: (oui: boolean) => void;
  onOuvrir: () => void;
};

export function CarteIdee({ idee, monId, occupe, onVoter, onOuvrir }: Props) {
  const enRelecture = idee.statut === "en-relecture";
  return (
    <View className="flex-row items-start gap-3 rounded-carte border border-ligne bg-white p-3">
      {enRelecture ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-[76px] w-[62px] items-center justify-center rounded-2xl border border-dashed border-gris"
        >
          <Text className="text-2xl">🔎</Text>
        </View>
      ) : (
        <BoutonMiamIdee idee={idee} occupe={occupe} onVoter={onVoter} />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityHint={TEXTES_IDEES.ouvrirIdee(idee.titre)}
        onPress={onOuvrir}
        className="min-w-0 flex-1 gap-1.5 active:opacity-70"
      >
        <PastilleStatutIdee statut={idee.statut} />
        <Text className="font-texte-gras text-[15px] leading-5 text-encre">{idee.titre}</Text>
        <AuteurIdee auteur={idee.auteur} monId={monId} taille={20} suite={TEXTES_IDEES.commentaires(idee.commentaires)} />
        {idee.reponseBrigade ? (
          <View className="self-start rounded-lg bg-encre px-2 py-0.5">
            <Text className="font-texte-gras text-xs text-jaune">{TEXTES_IDEES.brigadeARepondu}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
