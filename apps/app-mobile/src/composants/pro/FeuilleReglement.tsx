import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import type { ReglementVisite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixReglement } from "~/composants/pro/ChoixReglement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  /** « Karim B. » */
  nom: string;
  /** Coup de feu (2 additions ou plus en attente) : l'équipe tape le code que montre le client */
  codeRequis: boolean;
  /** Le code tapé ne correspond pas : on le dit, la feuille reste ouverte */
  erreurCode?: string | null;
  onValider: (reglement: ReglementVisite, codeSaisi: string | null) => void;
  onFermer: () => void;
};

const PAYE: ReglementVisite = { type: "paye", reductionPourcent: null, avantages: [] };

/**
 * « Réglée » au comptoir : le code du client si plusieurs additions attendent, puis comment ça s'est réglé (payé,
 * réduction, offert) et les avantages. Repart de « Payé » à chaque ouverture.
 */
export function FeuilleReglement({ visible, nom, codeRequis, erreurCode = null, onValider, onFermer }: Props) {
  const [reglement, setReglement] = useState<ReglementVisite>(PAYE);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!visible) return;
    setReglement(PAYE);
    setCode("");
  }, [visible]);

  const codeComplet = /^\d{4}$/.test(code);
  const pret = !codeRequis || codeComplet;

  return (
    <FeuilleBas
      visible={visible}
      titre={`Addition de ${nom}`}
      sousTitre={codeRequis ? "Plusieurs additions attendent : tape le code que te montre le client, pour ne pas te tromper de table." : undefined}
      onFermer={onFermer}
      pied={
        <Bouton
          libelle={reglement.type === "offert" ? "Valider la visite offerte" : "Valider la visite"}
          indice={pret ? undefined : "Tape d'abord les 4 chiffres du code"}
          desactive={!pret}
          onPress={() => onValider(reglement, codeRequis ? code : null)}
        />
      }
    >
      {codeRequis ? (
        <View className="gap-2">
          <Text className="font-texte-gras text-base text-encre">Code du client</Text>
          <TextInput
            accessibilityLabel={erreurCode ? `Code du client, 4 chiffres. ${erreurCode}` : "Code du client, 4 chiffres"}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
            placeholder="• • • •"
            placeholderTextColor={couleurs.gris}
            className={`h-16 rounded-2xl border-2 bg-white text-center font-titre text-3xl tracking-[12px] text-encre ${erreurCode ? "border-rouge-texte" : "border-encre"}`}
          />
          {erreurCode ? <Text className="font-texte-semi text-sm text-rouge-texte">{lierPonctuation(erreurCode)}</Text> : null}
        </View>
      ) : null}
      <ChoixReglement valeur={reglement} onChange={setReglement} />
    </FeuilleBas>
  );
}
