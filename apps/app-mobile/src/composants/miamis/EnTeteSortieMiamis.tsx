import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { PuceEtiquetteSortie } from "~/composants/miamis/PuceEtiquetteSortie";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { decrirePublicSortie } from "~/fonctions/miamis/decrire-public-sortie";
import { ecrireQuandLong } from "~/fonctions/miamis/ecrire-quand-long";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  sortie: SortieMiamisApi;
};

export function EnTeteSortieMiamis({ sortie }: Props) {
  const couleurs = utiliserCouleurs();
  const { nom, quiVoit } = decrirePublicSortie(sortie.public);
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <View className="rounded-full border-2 border-encre bg-jaune px-3 py-1">
          <Text className="font-texte-gras text-xs text-nuit">{ecrireQuandLong(sortie.quand)}</Text>
        </View>
        <View className={`flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1 ${quiVoit ? "border-encre bg-nuit" : "border-ligne bg-carte"}`}>
          {quiVoit ? <Ionicons name="lock-closed" size={12} color={couleurs.jaune} /> : null}
          <Text className={`font-texte-gras text-xs ${quiVoit ? "text-jaune" : "text-encre"}`}>{quiVoit ? `${nom} · ${quiVoit}` : nom}</Text>
        </View>
        {sortie.recurrente ? (
          <View className="flex-row items-center gap-1.5 rounded-full border-2 border-ligne bg-carte px-3 py-1">
            <Ionicons name="refresh" size={12} color={couleurs.encre} />
            <Text className="font-texte-gras text-xs text-encre">{TEXTES_SORTIE_MIAMIS.recurrente(sortie.habitues)}</Text>
          </View>
        ) : null}
      </View>
      <Text accessibilityRole="header" className="font-titre text-[30px] leading-[34px] text-encre">
        {sortie.titre}
      </Text>
      {sortie.description ? <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(sortie.description)}</Text> : null}
      {sortie.etiquettes.length > 0 ? (
        <View accessibilityLabel="Étiquettes de la sortie" className="flex-row flex-wrap gap-1.5">
          {sortie.etiquettes.map((e) => (
            <PuceEtiquetteSortie key={e.nom} nom={e.nom} libre={!e.officielle} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
