import { Text, View } from "react-native";

import { TEXTES_BLOCS_MON_LIEU_PAR_LANGUE } from "~/contenus/textes-blocs-mon-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nomLieu: string;
  emoji: string;
  visites: number;
  recompense: string;
  actif: boolean;
};

/** La carte de fidélité telle que la verront tes clients, mise à jour pendant que tu la règles. */
export function ApercuCarteFidelite({ nomLieu, emoji, visites, recompense, actif }: Props) {
  const T = utiliserTextes(TEXTES_BLOCS_MON_LIEU_PAR_LANGUE).fidelite;
  const texte = recompense.trim() || T.taRecompense;
  const lu = T.apercuLu(visites, texte, actif);
  return (
    <View accessible accessibilityLabel={lu} className={`gap-3 rounded-carte border-2 border-encre p-4 ${actif ? "bg-carte" : "bg-carte/60"}`}>
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl">{emoji}</Text>
        <Text numberOfLines={1} className="flex-1 font-texte-gras text-base text-encre">
          {nomLieu}
        </Text>
        <View className="rounded-full border-2 border-encre bg-nuit px-2 py-0.5">
          <Text className="font-texte-gras text-xs text-jaune">{T.apercu}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: visites }, (_, i) => (
          <View key={i} className={`h-9 w-9 items-center justify-center rounded-full border-2 border-encre ${i === visites - 1 ? "bg-jaune" : "bg-creme"}`}>
            <Text className="text-base">{i === visites - 1 ? "🎁" : ""}</Text>
          </View>
        ))}
      </View>
      <Text className="font-texte-semi text-[15px] leading-[22px] text-encre">{lierPonctuation(T.apres(visites, texte))}</Text>
      {!actif ? <Text className="font-texte text-[13px] text-gris">{T.enPause}</Text> : null}
    </View>
  );
}
