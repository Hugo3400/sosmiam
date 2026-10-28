import { Text, View } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { AuteurIdee } from "~/composants/idees-miamis/AuteurIdee";
import { PastilleStatutIdee } from "~/composants/idees-miamis/PastilleStatutIdee";
import { ecrireIlYa } from "~/fonctions/miamis/ecrire-il-y-a";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";

type Props = {
  idee: IdeeMiamis;
  monId: string;
};

export function EnTeteIdee({ idee, monId }: Props) {
  const { langue } = utiliserLangue();
  return (
    <View className="gap-2.5">
      <PastilleStatutIdee statut={idee.statut} />
      <Text accessibilityRole="header" className="font-titre text-[26px] leading-[30px] text-encre">
        {lierPonctuation(idee.titre)}
      </Text>
      {idee.detail ? <Text className="font-texte text-[15px] leading-6 text-encre">{lierPonctuation(idee.detail)}</Text> : null}
      <AuteurIdee auteur={idee.auteur} monId={monId} taille={26} suite={ecrireIlYa(idee.date, langue)} />
    </View>
  );
}
