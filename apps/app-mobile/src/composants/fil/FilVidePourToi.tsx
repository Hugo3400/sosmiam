import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  hauteur: number;
  /** Le serveur n'a pas répondu et rien n'est gardé sur le téléphone */
  horsLigne: boolean;
  onVoirAdresses: () => void;
};

/** Fil « Pour toi » sans aucune publication : les lieux préparent leurs vidéos (ou pas de réseau). Explorer reste ouvert. */
export function FilVidePourToi({ hauteur, horsLigne, onVoirAdresses }: Props) {
  return (
    <View style={{ height: hauteur }} className="items-center justify-center gap-4 bg-jaune px-8">
      <Mascotte expression={horsLigne ? "surprise" : "clin"} taille={140} />
      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
        {horsLigne ? "Pas de réseau" : "Le fil chauffe encore"}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-encre/75">
        {lierPonctuation(
          horsLigne
            ? "Impossible de charger le fil pour l'instant. Il revient dès que ta connexion aussi !"
            : "Les lieux préparent leurs premières vidéos. En attendant, leurs adresses t'attendent dans Explorer : va leur dire bonjour !",
        )}
      </Text>
      <Bouton libelle="Voir les adresses" variante="blanc" onPress={onVoirAdresses} className="mt-2 self-stretch" />
    </View>
  );
}
