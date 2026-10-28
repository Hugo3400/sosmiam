import { Pressable, Text, View } from "react-native";

import { TEXTES_QUI_EST_LA_PAR_LANGUE } from "~/contenus/textes-qui-est-la";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  pseudo: string;
  demande: boolean;
  enCours: boolean;
  onAjouter: () => void;
  onFermer: () => void;
};

export function CarteCoucouReciproque({ pseudo, demande, enCours, onAjouter, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_QUI_EST_LA_PAR_LANGUE);
  const ajoutPossible = !demande && !enCours;
  return (
    <View accessibilityLiveRegion="polite" className="gap-2.5 rounded-[20px] bg-nuit p-4">
      <Text accessibilityRole="header" className="font-titre text-[19px] leading-6 text-lait">
        {lierPonctuation(T.mutuelTitre(pseudo))}
      </Text>
      <Text className="font-texte text-[13px] leading-5 text-gris-nuit">{lierPonctuation(T.mutuelTexte)}</Text>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={demande ? T.demandeEnvoyee : T.ajouterLu(pseudo)}
          accessibilityState={{ disabled: !ajoutPossible, busy: enCours }}
          disabled={!ajoutPossible}
          onPress={() => {
            vibrerLegerement();
            onAjouter();
          }}
          className={`min-h-[46px] flex-1 items-center justify-center rounded-[14px] px-2 active:opacity-80 ${demande ? "bg-gris-nuit" : "bg-jaune"} ${enCours ? "opacity-60" : ""}`}
        >
          <Text className="text-center font-texte-gras text-sm text-nuit">{demande ? T.demandeEnvoyee : T.ajouter}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onFermer}
          className="min-h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-lait px-2 active:opacity-80"
        >
          <Text className="text-center font-texte-semi text-sm text-lait">{demande ? T.fermer : T.plusTard}</Text>
        </Pressable>
      </View>
    </View>
  );
}
