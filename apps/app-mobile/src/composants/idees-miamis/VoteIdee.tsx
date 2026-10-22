import { Text, View } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { BoutonMiamIdee } from "~/composants/idees-miamis/BoutonMiamIdee";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { decrireVotantsIdee } from "~/fonctions/idees-miamis/decrire-votants-idee";

type Props = {
  idee: IdeeMiamis;
  monId: string;
  idsBloques: ReadonlySet<string>;
  occupe: boolean;
  onVoter: (oui: boolean) => void;
};

export function VoteIdee({ idee, monId, idsBloques, occupe, onVoter }: Props) {
  const { visages, texte } = decrireVotantsIdee(idee, monId, idsBloques);
  return (
    <View className="flex-row items-center gap-3.5 rounded-carte border border-ligne bg-carte p-3">
      <BoutonMiamIdee idee={idee} grand occupe={occupe} onVoter={onVoter} />
      <View className="min-w-0 flex-1 gap-1">
        {visages.length > 0 ? (
          <View className="flex-row" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {visages.map((personne, rang) => (
              <View key={personne.id} style={{ marginLeft: rang === 0 ? 0 : -8, zIndex: visages.length - rang }}>
                <RondMiami personne={personne} taille={28} />
              </View>
            ))}
          </View>
        ) : null}
        <Text className="font-texte text-xs leading-4 text-gris">{texte}</Text>
      </View>
    </View>
  );
}
