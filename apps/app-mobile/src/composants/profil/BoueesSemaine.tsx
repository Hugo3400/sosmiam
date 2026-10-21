import { Text, View } from "react-native";

import { RESCOUSSES_PAR_SEMAINE } from "@sos-miam/commun/regles/rescousses";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
};

const TITRE = "Tes bouées de la semaine";

/** Tes bouées de la semaine : une 🛟 par rescousse, estompée une fois donnée. Elles se rechargent le lundi. */
export function BoueesSemaine({ restantes }: Props) {
  const disponibles = Math.min(RESCOUSSES_PAR_SEMAINE, Math.max(0, restantes));
  const message =
    disponibles === 0
      ? `Tu as donné tes ${RESCOUSSES_PAR_SEMAINE} rescousses cette semaine, bravo ! Elles se rechargent lundi.`
      : disponibles === RESCOUSSES_PAR_SEMAINE
        ? `Tes ${RESCOUSSES_PAR_SEMAINE} rescousses t'attendent cette semaine : donne-les aux lieux qui te font de l'œil, depuis le fil ou leur fiche.`
        : `Il te reste ${disponibles} rescousse${disponibles > 1 ? "s" : ""} cette semaine. Toutes rechargées lundi !`;
  const compte = `${disponibles} rescousse${disponibles > 1 ? "s" : ""} sur ${RESCOUSSES_PAR_SEMAINE} encore à donner`;

  return (
    <View accessible accessibilityLabel={`${TITRE}. ${compte}. ${message}`} className="flex-row items-center gap-3 border-t border-ligne pt-4">
      <View className="flex-row gap-1">
        {Array.from({ length: RESCOUSSES_PAR_SEMAINE }, (_, i) => (
          <Text key={i} className={`text-[26px] leading-8 ${i < disponibles ? "" : "opacity-25"}`}>🛟</Text>
        ))}
      </View>
      <View className="flex-1">
        <Text className="font-texte-gras text-[15px] leading-5 text-encre">{TITRE}</Text>
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(message)}</Text>
      </View>
    </View>
  );
}
