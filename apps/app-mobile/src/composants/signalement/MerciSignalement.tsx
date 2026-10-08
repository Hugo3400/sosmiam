import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { AideUrgence } from "~/composants/signalement/AideUrgence";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";

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

  // Ce qu'on vient de toucher a disparu : le lecteur d'écran repart du « Merci » (après le fondu d'entrée)
  useEffect(() => {
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(enTete.current), 250);
    return () => clearTimeout(minuterie);
  }, []);

  return (
    <View className="items-center gap-3 pb-2 pt-1">
      <Mascotte expression="clin" taille={96} />
      <Text ref={enTete} accessibilityRole="header" accessibilityLabel="Merci, c'est noté" className="text-center font-titre text-2xl text-encre">
        Merci, c'est noté 🚩
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-encre">
        {masqueePourTous
          ? "Cette publication n'apparaîtra plus dans ton fil. Ce type de contenu sera masqué pour tout le monde dès son premier signalement, puis vérifié à la main par un modérateur : retiré pour de bon s'il pose problème, remis en ligne sinon."
          : "Cette publication n'apparaîtra plus dans ton fil. On va regarder ça de près."}
      </Text>
      <Text className="text-center font-texte text-sm leading-5 text-gris">
        {masqueePourTous
          ? "Pour l'instant, ton signalement est gardé sur ton téléphone : il partira à l'équipe SOS Miam, et le masquage pour tout le monde s'appliquera, dès que l'app sera reliée à notre serveur."
          : "Pour l'instant, ton signalement est gardé sur ton téléphone : il partira à l'équipe SOS Miam dès que l'app sera reliée à notre serveur."}
      </Text>
      {grave ? (
        <View className="self-stretch">
          <AideUrgence />
        </View>
      ) : null}
      <Bouton libelle="Retour au fil" onPress={onFermer} className="mt-2 self-stretch" />
    </View>
  );
}
