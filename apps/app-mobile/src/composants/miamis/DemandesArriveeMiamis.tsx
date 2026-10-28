import { Text, View } from "react-native";

import type { DemandeArriveeMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { Bouton } from "~/composants/interface/Bouton";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { ecrireIlYa } from "~/fonctions/miamis/ecrire-il-y-a";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  demandes: DemandeArriveeMiamis[];
  enCours: string | null;
  onAccepter: (personneId: string) => void;
  onRefuser: (personneId: string) => void;
};

export function DemandesArriveeMiamis({ demandes, enCours, onAccepter, onRefuser }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  if (demandes.length === 0) return null;
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-titre text-xl text-encre">
          {`${T.demandesTitre} (${demandes.length})`}
        </Text>
        <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(T.demandesIntro)}</Text>
      </View>
      {demandes.map((d) => {
        const occupe = enCours === `accepter-${d.personne.id}` || enCours === `refuser-${d.personne.id}`;
        const details = [d.nouveau ? T.demandeNouveau : null, T.tenues(d.sortiesTenues.tenues, d.sortiesTenues.prevues), ecrireIlYa(d.date, langue)]
          .filter(Boolean)
          .join(" · ");
        return (
          <View key={d.personne.id} className="gap-2.5 border-t border-ligne pt-3">
            <View className="flex-row items-center gap-3">
              <RondMiami personne={d.personne} taille={40} />
              <View className="flex-1">
                <Text className="font-texte-gras text-[15px] text-encre">{`@${d.personne.pseudo}`}</Text>
                <Text className="font-texte text-xs text-gris">{details}</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <Bouton
                libelle={T.accepter}
                variante="encre"
                petit
                desactive={occupe}
                libelleLu={TE.accepterLu(d.personne.pseudo)}
                onPress={() => onAccepter(d.personne.id)}
                className="flex-1"
              />
              <Bouton
                libelle={T.refuser}
                variante="blanc"
                petit
                desactive={occupe}
                libelleLu={TE.refuserLu(d.personne.pseudo)}
                onPress={() => onRefuser(d.personne.id)}
                className="flex-1"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
