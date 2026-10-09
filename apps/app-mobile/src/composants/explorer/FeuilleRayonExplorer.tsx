import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Curseur } from "~/composants/interface/Curseur";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { RAYON_PROCHE_KM } from "~/contenus/portee-explorer";

type Props = {
  visible: boolean;
  rayonKm: number;
  /** « de toi » avec « Autour de moi », sinon « de Montpellier » (ou « de ta ville ») */
  autourDe: string;
  onValider: (km: number) => void;
  onFermer: () => void;
};

const dire = (km: number) => `${km} kilomètre${km > 1 ? "s" : ""}`;

/**
 * Feuille « Jusqu'où ? » d'Explorer : le rayon d'« À quelques kilomètres », de 1 à 50 km, au curseur. Rien ne change
 * tant qu'on n'a pas validé (la carte ne saute pas à chaque cran) ; le rayon est gardé pour la prochaine fois.
 */
export function FeuilleRayonExplorer({ visible, rayonKm, autourDe, onValider, onFermer }: Props) {
  const [km, setKm] = useState(rayonKm);
  // À chaque ouverture, on repart du rayon en cours
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) setKm(rayonKm);
  }

  return (
    <FeuilleBas
      visible={visible}
      titre="Jusqu'où ?"
      sousTitre={`Les lieux à moins de ${km} km ${autourDe}, sur la carte et dans la liste. Gardé pour la prochaine fois.`}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={`Voir à ${km} km`} onPress={() => onValider(km)} />
          <Bouton libelle="Annuler" variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <View className="items-center">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-titre text-[44px] leading-[52px] text-encre">
          {km} km
        </Text>
      </View>
      <Curseur valeur={km} min={RAYON_PROCHE_KM.min} max={RAYON_PROCHE_KM.max} onChanger={setKm} libelle="Rayon" dire={dire} />
      <View className="flex-row justify-between px-14">
        <Text className="font-texte text-xs text-gris">{RAYON_PROCHE_KM.min} km</Text>
        <Text className="font-texte text-xs text-gris">{RAYON_PROCHE_KM.max} km</Text>
      </View>
    </FeuilleBas>
  );
}
