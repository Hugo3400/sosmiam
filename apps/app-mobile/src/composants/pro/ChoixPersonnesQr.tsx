import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PERSONNES_PRESENTATION_MAX } from "@sos-miam/commun/regles/visites";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixReglement } from "~/composants/pro/ChoixReglement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  onMontrer: (personnes: number, reglement: ReglementVisite) => void;
  onFermer: () => void;
};

const PAYE: ReglementVisite = { type: "paye", reductionPourcent: null, avantages: [] };

/** Un bouton rond − ou + (48 pt) du compteur de personnes */
const tailleBouton = "h-12 w-12";

/**
 * Avant de montrer le QR : pour combien de personnes (1 à 12 ; il s'éteint quand tout le monde a scanné), et comment
 * la table a réglé (payé, réduction, offert, avantages), qui vaudra pour chacune de ses visites.
 */
export function ChoixPersonnesQr({ visible, onMontrer, onFermer }: Props) {
  const [personnes, setPersonnes] = useState(1);
  const [reglement, setReglement] = useState<ReglementVisite>(PAYE);

  useEffect(() => {
    if (!visible) return;
    setPersonnes(1);
    setReglement(PAYE);
  }, [visible]);

  const changer = (delta: number) => {
    vibrerLegerement();
    setPersonnes((p) => Math.min(PERSONNES_PRESENTATION_MAX, Math.max(1, p + delta)));
  };

  return (
    <FeuilleBas
      visible={visible}
      titre="Montrer le QR"
      sousTitre="Il change toutes les 30 s et s'éteint après 2 minutes, ou quand tout le monde a scanné."
      onFermer={onFermer}
      pied={<Bouton libelle={`Montrer le QR · ${personnes} personne${personnes > 1 ? "s" : ""}`} onPress={() => onMontrer(personnes, reglement)} />}
    >
      <View className="gap-2.5">
        <Text className="font-texte-gras text-base text-encre">Pour combien de personnes ?</Text>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Nombre de personnes"
          accessibilityValue={{ text: `${personnes} personne${personnes > 1 ? "s" : ""}` }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => changer(e.nativeEvent.actionName === "increment" ? 1 : -1)}
          className="flex-row items-center justify-between rounded-2xl border-2 border-encre bg-white px-3 py-2"
        >
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => changer(-1)}
            disabled={personnes <= 1}
            className={`${tailleBouton} items-center justify-center rounded-full border-2 border-encre active:opacity-70 ${personnes <= 1 ? "opacity-30" : ""}`}
          >
            <Ionicons name="remove" size={24} color={couleurs.encre} />
          </Pressable>
          <Text className="font-titre text-4xl text-encre">{personnes}</Text>
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => changer(1)}
            disabled={personnes >= PERSONNES_PRESENTATION_MAX}
            className={`${tailleBouton} items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-70 ${personnes >= PERSONNES_PRESENTATION_MAX ? "opacity-30" : ""}`}
          >
            <Ionicons name="add" size={24} color={couleurs.encre} />
          </Pressable>
        </View>
      </View>
      <ChoixReglement valeur={reglement} onChange={setReglement} />
    </FeuilleBas>
  );
}
