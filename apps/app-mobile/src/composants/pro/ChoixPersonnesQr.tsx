import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { PERSONNES_PRESENTATION_MAX } from "@sos-miam/commun/regles/visites";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixReglement } from "~/composants/pro/ChoixReglement";

type Props = {
  visible: boolean;
  onMontrer: (personnes: number, reglement: ReglementVisite) => void;
  onFermer: () => void;
};

const PAYE: ReglementVisite = { type: "paye", reductionPourcent: null, avantages: [] };

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
        <CompteurPlusMoins
          libelle="Nombre de personnes"
          valeur={personnes}
          min={1}
          max={PERSONNES_PRESENTATION_MAX}
          unite={(n) => `${n} personne${n > 1 ? "s" : ""}`}
          onChanger={setPersonnes}
        />
      </View>
      <ChoixReglement valeur={reglement} onChange={setReglement} />
    </FeuilleBas>
  );
}
