import { Text, View } from "react-native";

import {
  LONGUEUR_MAX_EXPLICATION_SIGNALEMENT,
  LONGUEUR_MIN_EXPLICATION_SIGNALEMENT,
  RAISONS_AVEC_EXPLICATION_OBLIGATOIRE,
  RAISONS_AVEC_MASQUAGE_IMMEDIAT,
} from "@sos-miam/commun/regles/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { AideUrgence } from "~/composants/signalement/AideUrgence";
import type { ChoixRaisonSignalement } from "~/contenus/raisons-signalement";

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
  const obligatoire = RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(raison.cle);
  const manque = obligatoire && explication.trim().length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT;
  const masqueePourTous = RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(raison.cle);

  return (
    <View className="gap-5 pb-2">
      {raison.precisions.length > 0 ? (
        <View className="gap-3">
          <Text className="font-texte-semi text-base text-encre">
            C'est plutôt… <Text className="font-texte text-gris">(facultatif)</Text>
          </Text>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {raison.precisions.map((p) => (
              <Pastille key={p} libelle={p} role="radio" choisi={precision === p} onPress={() => onChoisirPrecision(precision === p ? null : p)} />
            ))}
          </View>
        </View>
      ) : null}

      <ChampTexte
        libelle="Pourquoi ?"
        mention={obligatoire ? `obligatoire, au moins ${LONGUEUR_MIN_EXPLICATION_SIGNALEMENT} caractères` : "facultatif"}
        valeur={explication}
        onChangeTexte={onChangerExplication}
        placeholder="En quelques mots : ce qui ne va pas, à quel moment…"
        aide={`${explication.length}/${LONGUEUR_MAX_EXPLICATION_SIGNALEMENT} · Plus c'est précis, plus l'équipe peut agir vite.`}
        multiline
        textAlignVertical="top"
        maxLength={LONGUEUR_MAX_EXPLICATION_SIGNALEMENT}
        autoCapitalize="sentences"
      />

      {masqueePourTous ? (
        <Text className="font-texte text-sm leading-5 text-encre">
          🙈 Ce type de contenu sera masqué pour tout le monde dès son premier signalement, le temps qu'un modérateur le vérifie (dès que l'app sera
          reliée à notre serveur).
        </Text>
      ) : null}

      {raison.grave ? <AideUrgence /> : null}

      <Text className="font-texte text-xs leading-5 text-gris">
        En envoyant, tu confirmes que ton signalement est sincère et, à ta connaissance, exact. Signaler un contenu comme illicite en sachant que
        c'est faux, pour le faire retirer, peut être sanctionné par la loi.
      </Text>

      {manque ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm text-gris">
          Écris au moins {LONGUEUR_MIN_EXPLICATION_SIGNALEMENT} caractères pour qu'on sache quoi regarder.
        </Text>
      ) : null}
      <Bouton
        libelle="Envoyer le signalement"
        onPress={onEnvoyer}
        desactive={manque}
        indice={manque ? `Écris d'abord au moins ${LONGUEUR_MIN_EXPLICATION_SIGNALEMENT} caractères dans « Pourquoi ? »` : "Envoie ton signalement à l'équipe SOS Miam"}
      />
    </View>
  );
}
