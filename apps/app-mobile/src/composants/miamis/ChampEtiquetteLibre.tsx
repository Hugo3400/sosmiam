import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { LONGUEUR_MAX_ETIQUETTE_LIBRE } from "@sos-miam/commun/regles/etiquettes";
import { lireEtiquetteLibre } from "@sos-miam/commun/validation/lire-etiquette-libre";
import { REFUS_ETIQUETTE_PAR_LANGUE } from "~/contenus/textes-etiquettes";
import { TEXTES_ORGANISER_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  plein: boolean;
  onAjouter: (etiquette: { nom: string; officielle: boolean }) => void;
};

export function ChampEtiquetteLibre({ plein, onAjouter }: Props) {
  const refusEtiquette = utiliserTextes(REFUS_ETIQUETTE_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_ORGANISER_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const [texte, setTexte] = useState("");
  const [refus, setRefus] = useState<string | null>(null);

  function ajouter() {
    if (plein) return;
    const lue = lireEtiquetteLibre(texte);
    if (!lue.ok) return setRefus(refusEtiquette[lue.refus]);
    vibrerLegerement();
    onAjouter({ nom: lue.nom, officielle: lue.officielle });
    setTexte("");
    setRefus(null);
  }

  return (
    <View className="gap-1.5">
      <Text className="font-texte-gras text-xs uppercase tracking-widest text-gris">{T.libre}</Text>
      <View className="flex-row gap-2">
        <TextInput
          accessibilityLabel={T.libre}
          value={texte}
          onChangeText={(t) => {
            setTexte(t);
            setRefus(null);
          }}
          onSubmitEditing={ajouter}
          maxLength={LONGUEUR_MAX_ETIQUETTE_LIBRE}
          placeholder={T.librePlaceholder}
          placeholderTextColor={couleurs.gris}
          returnKeyType="done"
          editable={!plein}
          className={`min-h-12 flex-1 rounded-2xl border-2 bg-carte px-3.5 font-texte text-[15px] text-encre ${refus ? "border-rouge-texte" : "border-encre"}`}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: plein || texte.trim() === "" }}
          disabled={plein || texte.trim() === ""}
          onPress={ajouter}
          className={`min-h-12 items-center justify-center rounded-2xl border-2 border-encre px-4 active:opacity-80 ${plein || texte.trim() === "" ? "opacity-40" : ""}`}
        >
          <Text className="font-texte-gras text-[15px] text-encre">{T.ajouter}</Text>
        </Pressable>
      </View>
      {refus ? (
        <Text accessibilityLiveRegion="polite" className="font-texte-semi text-xs text-rouge-texte">
          {lierPonctuation(refus)}
        </Text>
      ) : null}
      <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(T.libreNote)}</Text>
    </View>
  );
}
