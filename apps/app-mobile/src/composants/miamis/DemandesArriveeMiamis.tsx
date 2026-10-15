import { Text, View } from "react-native";

import type { DemandeArriveeMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { Bouton } from "~/composants/interface/Bouton";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { ecrireIlYa } from "~/fonctions/miamis/ecrire-il-y-a";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  demandes: DemandeArriveeMiamis[];
  enCours: string | null;
  onAccepter: (personneId: string) => void;
  onRefuser: (personneId: string) => void;
};

export function DemandesArriveeMiamis({ demandes, enCours, onAccepter, onRefuser }: Props) {
  if (demandes.length === 0) return null;
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-titre text-xl text-encre">
          {`${TEXTES_SORTIE_MIAMIS.demandesTitre} (${demandes.length})`}
        </Text>
        <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(TEXTES_SORTIE_MIAMIS.demandesIntro)}</Text>
      </View>
      {demandes.map((d) => {
        const occupe = enCours === `accepter-${d.personne.id}` || enCours === `refuser-${d.personne.id}`;
        const details = [d.nouveau ? TEXTES_SORTIE_MIAMIS.demandeNouveau : null, TEXTES_SORTIE_MIAMIS.tenues(d.sortiesTenues.tenues, d.sortiesTenues.prevues), ecrireIlYa(d.date)]
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
                libelle={TEXTES_SORTIE_MIAMIS.accepter}
                variante="encre"
                petit
                desactive={occupe}
                libelleLu={`Accepter @${d.personne.pseudo}`}
                onPress={() => onAccepter(d.personne.id)}
                className="flex-1"
              />
              <Bouton
                libelle={TEXTES_SORTIE_MIAMIS.refuser}
                variante="blanc"
                petit
                desactive={occupe}
                libelleLu={`Refuser @${d.personne.pseudo}, sans le prévenir`}
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
