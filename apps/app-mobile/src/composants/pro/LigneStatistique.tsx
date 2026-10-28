import { Text, View } from "react-native";

import { TEXTES_BLOCS_MON_LIEU_PAR_LANGUE } from "~/contenus/textes-blocs-mon-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  emoji: string;
  libelle: string;
  /** Cette semaine */
  valeur: number;
  /** La semaine d'avant (null : pas encore de semaine d'avant) */
  avant: number | null;
  /** Les semaines, de la plus ancienne à celle en cours, pour la petite courbe en barres */
  historique: number[];
};

/** Un chiffre de la semaine, son écart avec la semaine d'avant, et ses dernières semaines en petites barres. */
export function LigneStatistique({ emoji, libelle, valeur, avant, historique }: Props) {
  const T = utiliserTextes(TEXTES_BLOCS_MON_LIEU_PAR_LANGUE).statistique;
  const ecart = avant === null ? null : valeur - avant;
  const max = Math.max(1, ...historique);
  const tendance = ecart === null || ecart === 0 ? T.pareil : ecart > 0 ? T.plus(ecart) : T.moins(-ecart);
  return (
    <View accessible accessibilityLabel={T.lu(libelle, valeur, tendance)} className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View className="flex-row items-center gap-3">
        <Text className="text-2xl">{emoji}</Text>
        <View className="flex-1">
          <Text className="font-texte text-sm text-gris">{libelle}</Text>
          <Text className="font-titre text-3xl text-encre">{valeur}</Text>
        </View>
        {ecart !== null && ecart !== 0 ? (
          <View className={`rounded-full border-2 border-encre px-3 py-1 ${ecart > 0 ? "bg-jaune" : "bg-creme"}`}>
            <Text className={`font-texte-gras text-sm ${ecart > 0 ? "text-nuit" : "text-encre"}`}>{ecart > 0 ? `+${ecart}` : `${ecart}`}</Text>
          </View>
        ) : null}
      </View>
      <View className="h-10 flex-row items-end gap-1">
        {historique.map((v, i) => (
          <View
            key={i}
            style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
            className={`flex-1 rounded-t ${i === historique.length - 1 ? "bg-encre" : "bg-jaune"} border border-encre`}
          />
        ))}
      </View>
    </View>
  );
}
