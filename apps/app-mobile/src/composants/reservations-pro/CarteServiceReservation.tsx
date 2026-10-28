import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { TEXTES_CARTE_SERVICE_PAR_LANGUE, TEXTES_REGLAGES_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireServiceReservation } from "~/fonctions/reservations/decrire-service-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  service: ServiceReservation;
  services: readonly ServiceReservation[];
  erreur: string | null;
  modifiable: boolean;
  onPress: () => void;
};

export function CarteServiceReservation({ service, services, erreur, modifiable, onPress }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_RESERVATIONS_PAR_LANGUE);
  const TS = utiliserTextes(TEXTES_CARTE_SERVICE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const decrit = decrireServiceReservation(service, services, langue);
  const aCorriger = erreur ? remplirModele(T.aCorriger, { erreur }) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={aCorriger ? `${decrit.lu} ${aCorriger}` : decrit.lu}
      accessibilityHint={modifiable ? TS.modifierIndice : TS.voirIndice}
      accessibilityState={{ disabled: !modifiable }}
      disabled={!modifiable}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-16 flex-row items-center gap-3 rounded-carte border-2 bg-carte px-4 py-3 active:opacity-80 ${erreur ? "border-tomate" : "border-encre"}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-jaune-clair">
        <Text className="text-2xl">{decrit.emoji}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-gras text-base text-encre">{decrit.titre}</Text>
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{decrit.jours}</Text>
        <Text className="font-texte-semi text-[14px] leading-5 text-encre">{`${decrit.plage} · ${decrit.rythme}`}</Text>
        <Text className="font-texte text-[13px] leading-[18px] text-encre">{decrit.capacite}</Text>
        {aCorriger ? <Text className="mt-1 font-texte-semi text-[13px] leading-[18px] text-rouge-texte">{lierPonctuation(aCorriger)}</Text> : null}
      </View>
      {modifiable ? <Ionicons name="chevron-forward" size={20} color={couleurs.encre} /> : null}
    </Pressable>
  );
}
