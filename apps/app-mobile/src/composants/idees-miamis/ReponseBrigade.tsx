import { Text, View } from "react-native";

import { AVATAR_CAPITAINE, PREFIXE_AVATAR_MIAMI } from "@sos-miam/commun/regles/avatars-miamis";
import type { ReponseBrigade as ReponseBrigadeIdee } from "@sos-miam/commun/types/idees";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { ecrireIlYa } from "~/fonctions/miamis/ecrire-il-y-a";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  reponse: ReponseBrigadeIdee;
};

export function ReponseBrigade({ reponse }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const brigade: PersonneResume = { id: "brigade", pseudo: "brigade", prenom: T.brigade, avatar: `${PREFIXE_AVATAR_MIAMI}${AVATAR_CAPITAINE.id}` };
  return (
    <View className="gap-2 rounded-carte bg-nuit p-4">
      <View className="flex-row items-center gap-2.5">
        <RondMiami personne={brigade} taille={34} fond="bg-jaune" />
        <View>
          <Text className="font-texte-gras text-sm text-lait">{T.brigade}</Text>
          <Text className="font-texte text-xs text-gris-nuit">{T.reponseOfficielle(ecrireIlYa(reponse.date, langue))}</Text>
        </View>
      </View>
      <Text className="font-texte text-sm leading-[21px] text-lait">{lierPonctuation(reponse.texte)}</Text>
    </View>
  );
}
