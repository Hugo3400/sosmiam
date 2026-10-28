import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { AideUrgence } from "~/composants/signalement/AideUrgence";
import { TEXTES_SIGNALEMENT_PAR_LANGUE } from "~/contenus/textes-signalement";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Raison grave : on rappelle encore les numéros d'urgence et Pharos */
  grave: boolean;
  /** Raison qui masque la publication pour tout le monde en attendant la modération (violence, contenu sexuel) */
  masqueePourTous: boolean;
  onFermer: () => void;
};

/** Dernière étape du signalement : merci, ce qui se passe maintenant, et retour au fil. */
export function MerciSignalement({ grave, masqueePourTous, onFermer }: Props) {
  const enTete = useRef<Text>(null);
  const T = utiliserTextes(TEXTES_SIGNALEMENT_PAR_LANGUE);

  // Ce qu'on vient de toucher a disparu : le lecteur d'écran repart du « Merci » (après le fondu d'entrée)
  useEffect(() => {
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(enTete.current), 250);
    return () => clearTimeout(minuterie);
  }, []);

  return (
    <View className="items-center gap-3 pb-2 pt-1">
      <Mascotte expression="clin" taille={96} />
      <Text ref={enTete} accessibilityRole="header" accessibilityLabel={T.merciNote} className="text-center font-titre text-2xl text-encre">
        {T.merciNote} 🚩
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-encre">{masqueePourTous ? T.masqueePourTous : T.pasMasquee}</Text>
      <Text className="text-center font-texte text-sm leading-5 text-gris">{T.anonyme}</Text>
      {grave ? (
        <View className="self-stretch">
          <AideUrgence />
        </View>
      ) : null}
      <Bouton libelle={T.retourFil} onPress={onFermer} className="mt-2 self-stretch" />
    </View>
  );
}
