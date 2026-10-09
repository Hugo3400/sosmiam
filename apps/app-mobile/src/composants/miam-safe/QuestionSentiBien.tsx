import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { utiliserServices } from "~/hooks/utiliser-services";
import { RaconterMiamSafe } from "~/composants/miam-safe/RaconterMiamSafe";

type Props = { lieuId: number; nomLieu: string };

type Reponse = "oui" | "non" | null;

/**
 * Après une visite validée : « Tu t'es senti·e bien ici ? ». Les oui comptent pour le repère « Les Miamis s'y sentent bien »
 * (90 % sur au moins 20 réponses) ; un non ne s'affiche jamais, il propose de raconter en privé. La réponse part par le
 * service Miam Safe (démo, ou API plus tard) ; si elle ne part pas, la question reste là.
 */
export function QuestionSentiBien({ lieuId, nomLieu }: Props) {
  const { miamSafe } = utiliserServices();
  const [reponse, setReponse] = useState<Reponse>(null);
  const repondre = async (oui: boolean) => {
    const r = await miamSafe.repondreSentiBien(lieuId, oui).catch(() => null);
    // « Pas vraiment » propose quand même de raconter, même si la réponse n'est pas partie
    if (r?.ok || !oui) setReponse(oui ? "oui" : "non");
  };

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
