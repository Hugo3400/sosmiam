import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_MIAM_SAFE_RACONTER_PAR_LANGUE } from "~/contenus/textes-miam-safe-raconter";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { RaconterMiamSafe } from "~/composants/miam-safe/RaconterMiamSafe";

type Props = { lieuId: number; nomLieu: string };

type Reponse = "oui" | "non" | "visite-requise" | null;

export function QuestionSentiBien({ lieuId, nomLieu }: Props) {
  const { miamSafe } = utiliserServices();
  const T = utiliserTextes(TEXTES_MIAM_SAFE_RACONTER_PAR_LANGUE);
  const [reponse, setReponse] = useState<Reponse>(null);
  const repondre = async (oui: boolean) => {
    const r = await miamSafe.repondreSentiBien(lieuId, oui).catch(() => null);
    // « Pas vraiment » propose quand même de raconter, même si la réponse n'est pas partie
    if (r?.ok || !oui) setReponse(oui ? "oui" : "non");
    else if (r?.erreur === "visite-requise") setReponse("visite-requise");
  };

  if (reponse === "visite-requise") {
    return (
      <View accessible accessibilityLiveRegion="polite" className="gap-1 rounded-carte border-2 border-encre bg-carte p-4">
        <Text className="font-texte-gras text-base text-encre">{T.merciReponse}</Text>
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(T.visitePasEncoreVue)}</Text>
      </View>
    );
  }

  if (reponse === "oui") {
    return (
      <View accessible accessibilityLiveRegion="polite" className="rounded-carte border-2 border-encre bg-carte p-4">
        <Text className="font-texte-gras text-base text-encre">{T.merciCompte(nomLieu)}</Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-lg text-encre">
        {T.question}
      </Text>
      {reponse === "non" ? (
        <>
          <Text className="font-texte text-base leading-6 text-gris">{T.desole}</Text>
          <RaconterMiamSafe lieuId={lieuId} nomLieu={nomLieu} />
        </>
      ) : (
        <View className="flex-row gap-3">
          <Bouton className="flex-1" libelle={T.oui} variante="jaune" onPress={() => void repondre(true)} />
          <Bouton className="flex-1" libelle={T.pasVraiment} variante="blanc" indice={T.pasVraimentIndice} onPress={() => void repondre(false)} />
        </View>
      )}
    </View>
  );
}
