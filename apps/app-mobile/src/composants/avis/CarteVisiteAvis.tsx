import { Text, View } from "react-native";

import { LIBELLES_MODE_VALIDATION_PAR_LANGUE } from "@sos-miam/commun/contenus/modes-validation";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Visite } from "@sos-miam/commun/types/visite";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";

type Props = {
  visite: Visite;
};

function decrireValidation(visite: Visite, langue: Langue): string {
  const mode = LIBELLES_MODE_VALIDATION_PAR_LANGUE[langue][visite.mode];
  return visite.valideLe ? `${mode} · ${ecrireJourLongLangue(visite.valideLe, langue)}` : mode;
}

export function CarteVisiteAvis({ visite }: Props) {
  const { langue } = utiliserLangue();
  const { lieu, reglement } = visite;
  const reglementAMontrer = reglement !== null && (reglement.type !== "paye" || reglement.avantages.length > 0);
  return (
    <View className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="h-14 w-14 items-center justify-center rounded-full border-2 border-encre bg-jaune-clair"
      >
        <Text className="text-2xl">{lieu.emoji}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-base leading-5 text-encre">{lieu.nom}</Text>
        {lieu.ville ? <Text className="font-texte text-sm text-gris">{lieu.ville}</Text> : null}
        <Text className="font-texte-semi text-[13px] leading-[18px] text-encre">{`✓ ${decrireValidation(visite, langue)}`}</Text>
        {reglementAMontrer ? (
          <View className="mt-1">
            <EtiquettesReglement reglement={reglement} pour="client" taille="petite" />
          </View>
        ) : null}
      </View>
    </View>
  );
}
