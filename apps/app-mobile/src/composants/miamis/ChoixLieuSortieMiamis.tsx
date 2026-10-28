import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { TEXTES_ORGANISER_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieu: Lieu | null;
  onChoisir: (lieuId: number) => void;
  erreur?: string | null;
};

export function ChoixLieuSortieMiamis({ lieu, onChoisir, erreur }: Props) {
  const T = utiliserTextes(TEXTES_ORGANISER_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const [ouvert, setOuvert] = useState(false);
  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lieu ? `${lieu.nom}, ${T.changerLieu}` : T.choisirLieu}
        onPress={() => {
          vibrerLegerement();
          setOuvert(true);
        }}
        className={`flex-row items-center gap-3 rounded-2xl border-2 bg-carte p-3 active:opacity-80 ${erreur ? "border-rouge-texte" : "border-encre"}`}
      >
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-jaune-clair">
          {lieu ? <Text className="text-xl">{lieu.emoji}</Text> : <Ionicons name="location-outline" size={22} color={couleurs.encre} />}
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
            {lieu ? lieu.nom : T.choisirLieu}
          </Text>
          <Text numberOfLines={1} className="font-texte text-xs text-gris">
            {lieu ? `${lieu.quartier} · ${lieu.ville} · ${T.changerLieu}` : T.lieuAide}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
      </Pressable>
      {erreur ? <Text className="font-texte-semi text-sm text-rouge-texte">{lierPonctuation(erreur)}</Text> : null}
      <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(T.ouNote)}</Text>
      <ChoixLieu
        visible={ouvert}
        titre={T.choisirLieu}
        dejaChoisis={lieu ? [lieu.id] : []}
        onChoisir={(id) => {
          onChoisir(id);
          setOuvert(false);
        }}
        onFermer={() => setOuvert(false)}
      />
    </View>
  );
}
