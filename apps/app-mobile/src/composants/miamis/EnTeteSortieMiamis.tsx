import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE } from "@sos-miam/commun/contenus/etiquettes-officielles";
import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { PuceEtiquetteSortie } from "~/composants/miamis/PuceEtiquetteSortie";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { decrirePublicSortie } from "~/fonctions/miamis/decrire-public-sortie";
import { ecrireQuandLong } from "~/fonctions/miamis/ecrire-quand-long";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  sortie: SortieMiamisApi;
};

export function EnTeteSortieMiamis({ sortie }: Props) {
  const nomsEtiquettes = utiliserTextes(NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE);
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const { nom, quiVoit } = decrirePublicSortie(sortie.public, langue);
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <View className="rounded-full border-2 border-encre bg-jaune px-3 py-1">
          <Text className="font-texte-gras text-xs text-nuit">{ecrireQuandLong(sortie.quand, langue)}</Text>
        </View>
        <View className={`flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1 ${quiVoit ? "border-encre bg-nuit" : "border-ligne bg-carte"}`}>
          {quiVoit ? <Ionicons name="lock-closed" size={12} color={couleurs.jaune} /> : null}
          <Text className={`font-texte-gras text-xs ${quiVoit ? "text-jaune" : "text-encre"}`}>{quiVoit ? `${nom} · ${quiVoit}` : nom}</Text>
        </View>
        {sortie.recurrente ? (
          <View className="flex-row items-center gap-1.5 rounded-full border-2 border-ligne bg-carte px-3 py-1">
            <Ionicons name="refresh" size={12} color={couleurs.encre} />
            <Text className="font-texte-gras text-xs text-encre">{T.recurrente(sortie.habitues)}</Text>
          </View>
        ) : null}
      </View>
      <Text accessibilityRole="header" className="font-titre text-[30px] leading-[34px] text-encre">
        {sortie.titre}
      </Text>
      {sortie.description ? <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(sortie.description)}</Text> : null}
      {sortie.etiquettes.length > 0 ? (
        <View accessibilityLabel={TE.etiquettesSortie} className="flex-row flex-wrap gap-1.5">
          {sortie.etiquettes.map((e) => (
            <PuceEtiquetteSortie key={e.nom} nom={e.officielle ? (nomsEtiquettes[e.nom] ?? e.nom) : e.nom} libre={!e.officielle} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
