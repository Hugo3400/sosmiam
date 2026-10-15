import { Pressable, Text, View } from "react-native";

import { TEXTES_QUI_EST_LA } from "~/contenus/textes-qui-est-la";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  pseudo: string;
  demande: boolean;
  enCours: boolean;
  onAjouter: () => void;
  onFermer: () => void;
};

export function CarteCoucouReciproque({ pseudo, demande, enCours, onAjouter, onFermer }: Props) {
  const ajoutPossible = !demande && !enCours;
  return (
    <View accessibilityLiveRegion="polite" className="gap-2.5 rounded-[20px] bg-encre p-4">
      <Text accessibilityRole="header" className="font-titre text-[19px] leading-6 text-creme">
        {lierPonctuation(TEXTES_QUI_EST_LA.mutuelTitre(pseudo))}
      </Text>
      <Text className="font-texte text-[13px] leading-5 text-gris-nuit">{lierPonctuation(TEXTES_QUI_EST_LA.mutuelTexte)}</Text>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={demande ? TEXTES_QUI_EST_LA.demandeEnvoyee : TEXTES_QUI_EST_LA.ajouterLu(pseudo)}
          accessibilityState={{ disabled: !ajoutPossible, busy: enCours }}
          disabled={!ajoutPossible}
          onPress={() => {
            vibrerLegerement();
            onAjouter();
          }}
          className={`min-h-[46px] flex-1 items-center justify-center rounded-[14px] px-2 active:opacity-80 ${demande ? "bg-gris-nuit" : "bg-jaune"} ${enCours ? "opacity-60" : ""}`}
        >
          <Text className="text-center font-texte-gras text-sm text-encre">{demande ? TEXTES_QUI_EST_LA.demandeEnvoyee : TEXTES_QUI_EST_LA.ajouter}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onFermer}
          className="min-h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-creme px-2 active:opacity-80"
        >
          <Text className="text-center font-texte-semi text-sm text-creme">{demande ? TEXTES_QUI_EST_LA.fermer : TEXTES_QUI_EST_LA.plusTard}</Text>
        </Pressable>
      </View>
    </View>
  );
}
