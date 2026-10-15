import { Text, View } from "react-native";

import { AVATAR_CAPITAINE, PREFIXE_AVATAR_MIAMI } from "@sos-miam/commun/regles/avatars-miamis";
import type { ReponseBrigade as ReponseBrigadeIdee } from "@sos-miam/commun/types/idees";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { ecrireIlYa } from "~/fonctions/miamis/ecrire-il-y-a";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  reponse: ReponseBrigadeIdee;
};

const BRIGADE: PersonneResume = { id: "brigade", pseudo: "brigade", prenom: TEXTES_IDEES.brigade, avatar: `${PREFIXE_AVATAR_MIAMI}${AVATAR_CAPITAINE.id}` };

export function ReponseBrigade({ reponse }: Props) {
  return (
    <View className="gap-2 rounded-carte bg-encre p-4">
      <View className="flex-row items-center gap-2.5">
        <RondMiami personne={BRIGADE} taille={34} fond="bg-jaune" />
        <View>
          <Text className="font-texte-gras text-sm text-creme">{TEXTES_IDEES.brigade}</Text>
          <Text className="font-texte text-xs text-gris-nuit">{TEXTES_IDEES.reponseOfficielle(ecrireIlYa(reponse.date))}</Text>
        </View>
      </View>
      <Text className="font-texte text-sm leading-[21px] text-creme">{lierPonctuation(reponse.texte)}</Text>
    </View>
  );
}
