import { Text, View } from "react-native";

import type { EvenementMiamis } from "@sos-miam/commun/types/qui-est-la";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_ACCUEIL_MIAMIS } from "~/contenus/textes-miamis";
import { decrireEvenementMiamis } from "~/fonctions/miamis/decrire-evenement-miamis";
import { ecrireIlYa } from "~/fonctions/miamis/ecrire-il-y-a";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  evenements: EvenementMiamis[];
};

const LA_BRIGADE: PersonneResume = { id: "brigade", pseudo: "brigade", prenom: "La Brigade", avatar: "miami:capitaine" };

export function SectionFilMiamis({ evenements }: Props) {
  const maintenant = new Date();
  return (
    <View className="gap-3 px-5">
      <Text accessibilityRole="header" className="font-titre text-[22px] text-encre">
        {TEXTES_ACCUEIL_MIAMIS.filTitre}
      </Text>
      {evenements.length === 0 ? (
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_ACCUEIL_MIAMIS.filVide)}</Text>
      ) : (
        <View className="gap-3">
          {evenements.map((e) => {
            const qui = e.auteur ? `@${e.auteur.pseudo}` : LA_BRIGADE.prenom;
            const quoi = decrireEvenementMiamis(e);
            const quand = ecrireIlYa(e.date, maintenant);
            return (
              <View key={e.id} accessible accessibilityLabel={`${qui} ${quoi}, ${quand}`} className="flex-row items-start gap-2.5">
                <RondMiami personne={e.auteur ?? LA_BRIGADE} taille={32} />
                <View className="flex-1 gap-0.5">
                  <Text className="font-texte text-sm leading-5 text-encre">
                    <Text className="font-texte-semi">{qui}</Text>
                    {` ${lierPonctuation(quoi)}`}
                  </Text>
                  <Text className="font-texte text-xs text-gris">{quand}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
