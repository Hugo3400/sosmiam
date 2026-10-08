import { Text, View } from "react-native";

import { RESCOUSSES_PAR_SEMAINE } from "@sos-miam/commun/regles/rescousses";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
};

/** Tes bouées de la semaine : une 🛟 par rescousse, estompée une fois donnée. Elles se rechargent le lundi. */
export function BoueesSemaine({ restantes }: Props) {
  const disponibles = Math.min(RESCOUSSES_PAR_SEMAINE, Math.max(0, restantes));
  const message =
    disponibles === 0
      ? `Tu as donné tes ${RESCOUSSES_PAR_SEMAINE} rescousses cette semaine, bravo ! Elles se rechargent lundi.`
      : disponibles === RESCOUSSES_PAR_SEMAINE
        ? `Tes ${RESCOUSSES_PAR_SEMAINE} rescousses t'attendent cette semaine : donne-les aux lieux qui te font de l'œil, depuis le fil ou leur fiche.`
        : `Il te reste ${disponibles} rescousse${disponibles > 1 ? "s" : ""} cette semaine. Toutes rechargées lundi !`;

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">Tes bouées de la semaine</Text>
      <View
        accessible
        accessibilityLabel={`${disponibles} rescousse${disponibles > 1 ? "s" : ""} sur ${RESCOUSSES_PAR_SEMAINE} encore à donner`}
        className="flex-row gap-3"
      >
        {Array.from({ length: RESCOUSSES_PAR_SEMAINE }, (_, i) => (
          <Text key={i} className={`text-4xl ${i < disponibles ? "" : "opacity-25"}`}>🛟</Text>
        ))}
      </View>
      <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(message)}</Text>
    </View>
  );
}
