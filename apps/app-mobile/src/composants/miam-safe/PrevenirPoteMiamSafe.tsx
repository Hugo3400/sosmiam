import { useState } from "react";
import { Text, View } from "react-native";

import { DUREE_PARTAGE_POSITION_MINUTES } from "@sos-miam/commun/regles/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { Pastille } from "~/composants/interface/Pastille";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = { nomLieu: string };

/**
 * Prévenir un pote de ta bande : il reçoit « [Toi] ne se sent pas en sécurité au [lieu] », ta position pendant 1 h et un
 * bouton pour t'appeler. Rien ne part sans ton geste ; tu arrêtes le partage quand tu veux.
 * Démo : rien n'est vraiment envoyé, et la position n'est pas encore lue.
 */
export function PrevenirPoteMiamSafe({ nomLieu }: Props) {
  const { potes } = utiliserCommunaute();
  const [choisi, setChoisi] = useState<string | null>(null);
  const [jusqua, setJusqua] = useState<Date | null>(null);
  const pote = potes.find((p) => p.id === choisi) ?? null;

  if (jusqua && pote) {
    const heure = formaterHeure(`${jusqua.getHours()}:${String(jusqua.getMinutes()).padStart(2, "0")}`);
    return (
      <View className="gap-4">
        <View accessible className="gap-2 rounded-2xl bg-white p-4">
          <Text className="font-texte-gras text-lg text-encre">{pote.prenom} est prévenu·e</Text>
          <Text className="font-texte text-base leading-6 text-encre">
            {pote.prenom} sait que tu es au {nomLieu} et voit où tu es jusqu'à {heure}. Tu peux aussi l'appeler, tout simplement.
          </Text>
        </View>
        <Bouton libelle="Arrêter le partage" variante="blanc" indice={`${pote.prenom} ne verra plus où tu es`} onPress={() => setJusqua(null)} />
      </View>
    );
  }

  if (potes.length === 0) {
    return <Text className="font-texte text-base leading-6 text-gris">Ta bande est vide pour l'instant. Appelle un proche, ou les secours si tu es en danger.</Text>;
  }

  return (
    <View className="gap-4">
      <Text className="font-texte text-base leading-6 text-gris">
        Il voit où tu es pendant {DUREE_PARTAGE_POSITION_MINUTES / 60} h, avec un bouton pour t'appeler. Tu arrêtes quand tu veux.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {potes.map((p, i) => (
          <Pastille key={p.id} libelle={p.prenom} emoji={p.avatar} role="radio" position={i + 1} total={potes.length} choisi={choisi === p.id} onPress={() => setChoisi(p.id)} />
        ))}
      </View>
      <Bouton
        libelle={pote ? `Prévenir ${pote.prenom}` : "Prévenir"}
        variante="encre"
        desactive={!pote}
        indice={pote ? `${pote.prenom} verra où tu es pendant une heure` : "Choisis d'abord un pote"}
        onPress={() => setJusqua(new Date(Date.now() + DUREE_PARTAGE_POSITION_MINUTES * 60_000))}
      />
    </View>
  );
}
