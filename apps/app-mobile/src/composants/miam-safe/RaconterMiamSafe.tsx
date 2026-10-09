import { useState } from "react";
import { Text, View } from "react-native";

import { DELAI_LECTURE_SIGNALEMENT_HEURES, RAISONS_SIGNALEMENT_MIAM_SAFE, type RaisonSignalementMiamSafe } from "@sos-miam/commun/regles/miam-safe";
import { LONGUEUR_MAX_EXPLICATION_SIGNALEMENT, LONGUEUR_MIN_EXPLICATION_SIGNALEMENT } from "@sos-miam/commun/regles/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { Mascotte } from "~/composants/marque/Mascotte";
import { LIBELLES_RAISON_MIAM_SAFE } from "~/contenus/miam-safe";

type Props = { nomLieu: string };

/**
 * Raconter après coup ce qui s'est passé dans un lieu : une raison, tes mots, et c'est lu par notre équipe sous 48 h.
 * Jamais affiché sur la fiche du lieu. Démo : rien n'est encore envoyé.
 */
export function RaconterMiamSafe({ nomLieu }: Props) {
  const [raison, setRaison] = useState<RaisonSignalementMiamSafe | null>(null);
  const [texte, setTexte] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const texteRequis = raison === "autre" && texte.trim().length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT;

  if (envoye) {
    return (
      <View accessible className="items-center gap-3 py-2">
        <Mascotte expression="clin" taille={110} />
        <Text className="text-center font-texte-gras text-lg text-encre">Merci de nous l'avoir dit.</Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          Notre équipe le lit sous {DELAI_LECTURE_SIGNALEMENT_HEURES} h et te dira ce qu'elle a décidé. Rien n'apparaît sur la fiche du lieu.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="font-texte text-base leading-6 text-gris">Ce qui s'est passé au {nomLieu}. Ça reste entre toi et notre équipe.</Text>
      <View className="gap-2">
        {RAISONS_SIGNALEMENT_MIAM_SAFE.map((r, i) => (
          <Pastille
            key={r}
            libelle={LIBELLES_RAISON_MIAM_SAFE[r].titre}
            indice={LIBELLES_RAISON_MIAM_SAFE[r].detail}
            role="radio"
            position={i + 1}
            total={RAISONS_SIGNALEMENT_MIAM_SAFE.length}
            choisi={raison === r}
            onPress={() => setRaison(r)}
          />
        ))}
      </View>
      {raison ? <Text className="font-texte text-sm leading-5 text-gris">{LIBELLES_RAISON_MIAM_SAFE[raison].detail}</Text> : null}
      <ChampTexte
        libelle="Avec tes mots"
        mention={raison === "autre" ? undefined : "facultatif"}
        valeur={texte}
        onChangeTexte={setTexte}
        multiline
        maxLength={LONGUEUR_MAX_EXPLICATION_SIGNALEMENT}
      />
      <Bouton
        libelle="Envoyer à l'équipe"
        variante="encre"
        desactive={raison === null || texteRequis}
        indice={raison === null ? "Choisis d'abord ce qui s'est passé" : texteRequis ? "Raconte en quelques mots ce qui s'est passé" : undefined}
        onPress={() => setEnvoye(true)}
      />
    </View>
  );
}
