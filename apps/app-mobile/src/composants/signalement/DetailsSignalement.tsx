import { Text, View } from "react-native";

import {
  LONGUEUR_MAX_EXPLICATION_SIGNALEMENT,
  LONGUEUR_MIN_EXPLICATION_SIGNALEMENT,
  RAISONS_AVEC_EXPLICATION_OBLIGATOIRE,
  RAISONS_AVEC_MASQUAGE_IMMEDIAT,
} from "@sos-miam/commun/regles/signalement";
import { nettoyerTexteSignalement } from "@sos-miam/commun/validation/nettoyer-texte-signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { AideUrgence } from "~/composants/signalement/AideUrgence";
import type { ChoixRaisonSignalement } from "~/contenus/raisons-signalement";
import { TEXTES_SIGNALEMENT_PAR_LANGUE } from "~/contenus/textes-signalement";
import { traduireRaisonSignalement } from "~/fonctions/signalement/traduire-raison-signalement";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  raison: ChoixRaisonSignalement;
  precision: string | null;
  onChoisirPrecision: (precision: string | null) => void;
  explication: string;
  onChangerExplication: (texte: string) => void;
  onEnvoyer: () => void;
};

/** Deuxième étape du signalement : préciser la raison et expliquer pourquoi, avec ses mots. */
export function DetailsSignalement({ raison, precision, onChoisirPrecision, explication, onChangerExplication, onEnvoyer }: Props) {
  const T = utiliserTextes(TEXTES_SIGNALEMENT_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const precisionsAffichees = traduireRaisonSignalement(raison, langue).precisions;
  const obligatoire = RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(raison.cle);
  const manque = obligatoire && nettoyerTexteSignalement(explication).length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT;
  const masqueePourTous = RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(raison.cle);

  return (
    <View className="gap-5 pb-2">
      {raison.precisions.length > 0 ? (
        <View className="gap-3">
          <Text className="font-texte-semi text-base text-encre">
            {T.plutot} <Text className="font-texte text-gris">({T.facultatif})</Text>
          </Text>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {raison.precisions.map((p, i) => (
              <Pastille
                key={p}
                libelle={precisionsAffichees[i] ?? p}
                role="radio"
                choisi={precision === p}
                position={i + 1}
                total={raison.precisions.length}
                // Facultatif : une précision choisie s'enlève en la touchant encore
                indice={precision === p ? T.toucherEncore : undefined}
                onPress={() => onChoisirPrecision(precision === p ? null : p)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <ChampTexte
        libelle={T.pourquoi}
        mention={obligatoire ? T.obligatoire(LONGUEUR_MIN_EXPLICATION_SIGNALEMENT) : T.facultatif}
        valeur={explication}
        onChangeTexte={onChangerExplication}
        placeholder={T.placeholder}
        aide={T.aide(explication.length, LONGUEUR_MAX_EXPLICATION_SIGNALEMENT)}
        multiline
        textAlignVertical="top"
        maxLength={LONGUEUR_MAX_EXPLICATION_SIGNALEMENT}
        autoCapitalize="sentences"
      />

      {/* Affiché avec un singe qui se cache les yeux (🙈), lu sans */}
      {masqueePourTous ? (
        <Text accessibilityLabel={T.masquageImmediat} className="font-texte text-sm leading-5 text-encre">
          🙈 {T.masquageImmediat}
        </Text>
      ) : null}

      {raison.grave ? <AideUrgence /> : null}

      <Text className="font-texte text-xs leading-5 text-gris">{T.sincerite}</Text>

      {manque ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm text-gris">
          {T.manque(LONGUEUR_MIN_EXPLICATION_SIGNALEMENT)}
        </Text>
      ) : null}
      <Bouton
        libelle={T.envoyer}
        onPress={onEnvoyer}
        desactive={manque}
        indice={manque ? T.indiceManque(LONGUEUR_MIN_EXPLICATION_SIGNALEMENT, T.pourquoi) : T.indiceEnvoyer}
      />
    </View>
  );
}
