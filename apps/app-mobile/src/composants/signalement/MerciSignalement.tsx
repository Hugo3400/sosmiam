import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { AideUrgence } from "~/composants/signalement/AideUrgence";

type Props = {
  /** Raison grave : on rappelle encore les numéros d'urgence et Pharos */
  grave: boolean;
  /** Raison qui masque la publication pour tout le monde en attendant la modération (violence, contenu sexuel) */
  masqueePourTous: boolean;
  onFermer: () => void;
};

/** Dernière étape du signalement : merci, ce qui se passe maintenant, et retour au fil. */
export function MerciSignalement({ grave, masqueePourTous, onFermer }: Props) {
  return (
    <View className="items-center gap-3 pb-2 pt-1">
      <Mascotte expression="clin" taille={96} />
      <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
        Merci, c'est noté 🚩
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-encre">
        {masqueePourTous
          ? "Ce type de contenu est masqué pour tout le monde dès qu'il est signalé. Un modérateur le vérifie à la main : retiré pour de bon s'il pose problème, remis en ligne sinon."
          : "Cette publication n'apparaîtra plus dans ton fil. On va regarder ça de près."}
      </Text>
      <Text className="text-center font-texte text-sm leading-5 text-gris">
        Pour l'instant, ton signalement est gardé sur ton téléphone : il partira à l'équipe SOS Miam dès que l'app sera reliée à notre serveur.
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
