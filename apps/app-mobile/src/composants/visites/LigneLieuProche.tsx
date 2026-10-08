import { Text, View } from "react-native";

import { calculerPointsVisite } from "@sos-miam/commun/fonctions/visites/calculer-points-visite";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { BoutonDemanderAddition } from "~/composants/visites/BoutonDemanderAddition";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";

type Props = {
  lieu: Lieu;
  /** Distance depuis ta position, en mètres ; absente en démo ou dans la recherche */
  distanceM?: number | null;
};

/**
 * Un lieu de « Tu es chez qui ? » : son emoji, son nom, son quartier, la distance si on la connaît, son SOS s'il est en cours,
 * et « Demander l'addition ici ». VoiceOver lit d'abord le lieu d'un bloc, puis le bouton (qui redit le lieu dans son indice).
 */
export function LigneLieuProche({ lieu, distanceM = null }: Props) {
  const sos = estSosEnCours(lieu);
  const distance = distanceM === null ? null : `à ${formaterDistance(distanceM / 1000)}`;
  const infos = [lieu.nom, `${lieu.quartier}, ${lieu.ville}`, distance, sos ? `SOS en cours, ta visite vaut ${calculerPointsVisite(true)} points` : null];
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
      <View accessible accessibilityLabel={infos.filter(Boolean).join(", ")} className="flex-row items-center gap-3">
        <View
          style={{ backgroundColor: lieu.couleurs[0] }}
          className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre"
        >
          <Text className="text-2xl">{lieu.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-titre-gras text-lg leading-6 text-encre">{lieu.nom}</Text>
          <Text className="font-texte text-sm text-gris">
            {lieu.quartier} · {lieu.ville}
          </Text>
        </View>
        {distance ? (
          <View className="rounded-full border-2 border-encre bg-jaune-clair px-2.5 py-1">
            <Text className="font-texte-gras text-xs text-encre">{distance}</Text>
          </View>
        ) : null}
      </View>
      {sos ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row items-center gap-2 self-start rounded-full bg-rose-alerte px-3 py-1">
          <View className="h-2 w-2 rounded-full bg-rouge-sos" />
          <Text className="font-texte-semi text-xs text-rouge-texte">SOS en cours · ta visite vaut +{calculerPointsVisite(true)}</Text>
        </View>
      ) : null}
      <BoutonDemanderAddition lieu={lieu} variante="blanc" libelle="Demander l'addition ici" />
    </View>
  );
}
