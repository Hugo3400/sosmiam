import { useState } from "react";
import { Text, View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { DELAI_LECTURE_SIGNALEMENT_HEURES, RAISONS_SIGNALEMENT_MIAM_SAFE, type RaisonSignalementMiamSafe } from "@sos-miam/commun/regles/miam-safe";
import { LONGUEUR_MAX_EXPLICATION_SIGNALEMENT, LONGUEUR_MIN_EXPLICATION_SIGNALEMENT } from "@sos-miam/commun/regles/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { LIBELLES_RAISON_MIAM_SAFE_PAR_LANGUE } from "~/contenus/miam-safe";
import { TEXTES_MIAM_SAFE_RACONTER_PAR_LANGUE } from "~/contenus/textes-miam-safe-raconter";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { lieuId: number; nomLieu: string };

export function RaconterMiamSafe({ lieuId, nomLieu }: Props) {
  const { miamSafe } = utiliserServices();
  const T = utiliserTextes(TEXTES_MIAM_SAFE_RACONTER_PAR_LANGUE);
  const raisons = utiliserTextes(LIBELLES_RAISON_MIAM_SAFE_PAR_LANGUE);
  const messages = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [raison, setRaison] = useState<RaisonSignalementMiamSafe | null>(null);
  const [texte, setTexte] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const texteRequis = raison === "autre" && texte.trim().length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT;

  if (envoye) {
    return (
      <View accessible accessibilityLiveRegion="polite" className="items-center gap-3 py-2">
        <Text className="text-center font-texte-gras text-lg text-encre">{T.merci}</Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">{T.lecture(DELAI_LECTURE_SIGNALEMENT_HEURES)}</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="font-texte text-base leading-6 text-gris">{T.intro(direChezLieuLangue(nomLieu, langue))}</Text>
      <View className="gap-2">
        {RAISONS_SIGNALEMENT_MIAM_SAFE.map((r, i) => (
          <Pastille
            key={r}
            libelle={raisons[r].titre}
            indice={raisons[r].detail}
            role="radio"
            position={i + 1}
            total={RAISONS_SIGNALEMENT_MIAM_SAFE.length}
            choisi={raison === r}
            onPress={() => setRaison(r)}
          />
        ))}
      </View>
      {raison ? <Text className="font-texte text-sm leading-5 text-gris">{raisons[raison].detail}</Text> : null}
      <ChampTexte
        libelle={T.avecTesMots}
        mention={raison === "autre" ? undefined : T.facultatif}
        valeur={texte}
        onChangeTexte={setTexte}
        multiline
        maxLength={LONGUEUR_MAX_EXPLICATION_SIGNALEMENT}
      />
      <Bouton
        libelle={T.envoyer}
        variante="encre"
        desactive={raison === null || texteRequis || envoi}
        indice={raison === null ? T.indiceRaison : texteRequis ? T.indiceTexte : undefined}
        onPress={async () => {
          if (raison === null || envoi) return;
          setEnvoi(true);
          setErreur(null);
          const r = await miamSafe.signaler({ lieuId, raison, explication: texte.trim() }).catch(() => null);
          setEnvoi(false);
          if (r?.ok) return setEnvoye(true);
          const message = messages[r ? r.erreur : "hors-ligne"];
          setErreur(`${message.titre}. ${message.texte}`);
        }}
      />
      {erreur ? <Text accessibilityRole="alert" className="font-texte-semi text-base leading-6 text-rouge-texte">{erreur}</Text> : null}
    </View>
  );
}
