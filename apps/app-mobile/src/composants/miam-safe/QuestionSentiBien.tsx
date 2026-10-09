import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { RaconterMiamSafe } from "~/composants/miam-safe/RaconterMiamSafe";

type Props = { nomLieu: string };

type Reponse = "oui" | "non" | null;

/**
 * Après une visite validée : « Tu t'es senti·e bien ici ? ». Les oui comptent pour le repère « Les Miamis s'y sentent bien »
 * (90 % sur au moins 20 réponses) ; un non ne s'affiche jamais, il propose de raconter en privé. Démo : rien n'est envoyé.
 */
export function QuestionSentiBien({ nomLieu }: Props) {
  const [reponse, setReponse] = useState<Reponse>(null);

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
          <RaconterMiamSafe nomLieu={nomLieu} />
        </>
      ) : (
        <View className="flex-row gap-3">
          <Bouton className="flex-1" libelle="Oui" variante="jaune" onPress={() => setReponse("oui")} />
          <Bouton className="flex-1" libelle="Pas vraiment" variante="blanc" indice="Ça ne s'affiche jamais sur la fiche du lieu" onPress={() => setReponse("non")} />
        </View>
      )}
    </View>
  );
}
