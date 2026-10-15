import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserServices } from "~/hooks/utiliser-services";
import { RaconterMiamSafe } from "~/composants/miam-safe/RaconterMiamSafe";

type Props = { lieuId: number; nomLieu: string };

type Reponse = "oui" | "non" | "visite-requise" | null;

const VISITE_PAS_ENCORE_VUE = lierPonctuation(
  "Elle ne compte qu'après une visite validée dans ce lieu, et on ne trouve pas encore la tienne de notre côté : rien n'est parti.",
);

export function QuestionSentiBien({ lieuId, nomLieu }: Props) {
  const { miamSafe } = utiliserServices();
  const [reponse, setReponse] = useState<Reponse>(null);
  const repondre = async (oui: boolean) => {
    const r = await miamSafe.repondreSentiBien(lieuId, oui).catch(() => null);
    // « Pas vraiment » propose quand même de raconter, même si la réponse n'est pas partie
    if (r?.ok || !oui) setReponse(oui ? "oui" : "non");
    else if (r?.erreur === "visite-requise") setReponse("visite-requise");
  };

  if (reponse === "visite-requise") {
    return (
      <View accessible accessibilityLiveRegion="polite" className="gap-1 rounded-carte border-2 border-encre bg-white p-4">
        <Text className="font-texte-gras text-base text-encre">Merci pour ta réponse.</Text>
        <Text className="font-texte text-base leading-6 text-gris">{VISITE_PAS_ENCORE_VUE}</Text>
      </View>
    );
  }

  if (reponse === "oui") {
    return (
      <View accessible accessibilityLiveRegion="polite" className="rounded-carte border-2 border-encre bg-white p-4">
        <Text className="font-texte-gras text-base text-encre">Merci, ça compte pour {nomLieu}.</Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
      <Text accessibilityRole="header" className="font-texte-gras text-lg text-encre">
        Tu t'es senti·e bien ici ?
      </Text>
      {reponse === "non" ? (
        <>
          <Text className="font-texte text-base leading-6 text-gris">Désolé·e. Rien ne s'affiche sur la fiche : si tu veux, raconte-nous ce qui s'est passé.</Text>
          <RaconterMiamSafe lieuId={lieuId} nomLieu={nomLieu} />
        </>
      ) : (
        <View className="flex-row gap-3">
          <Bouton className="flex-1" libelle="Oui" variante="jaune" onPress={() => void repondre(true)} />
          <Bouton className="flex-1" libelle="Pas vraiment" variante="blanc" indice="Ça ne s'affiche jamais sur la fiche du lieu" onPress={() => void repondre(false)} />
        </View>
      )}
    </View>
  );
}
