import type { Ref } from "react";
import { Text, View } from "react-native";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";

export type ActionEchecVisite = { libelle: string; onPress: () => void; variante?: "jaune" | "blanc" };

type Props = {
  erreur: ErreurService;
  /** Distance, imprécision, lieu, date de fin de pause… pour remplir le texte */
  details?: DetailsErreur;
  /** Le lieu concerné, si les détails ne le donnent pas */
  lieuNom?: string;
  /** Les boutons sous le texte (« Réessayer », « Ouvrir les réglages », « Voir ma demande »…), dans l'ordre */
  actions?: ActionEchecVisite[];
  /** Le titre, pour y placer le lecteur d'écran quand le message apparaît */
  refTitre?: Ref<Text>;
};

/**
 * Pourquoi une visite n'a pas pu être demandée ou validée (position, QR, délai, réseau…) : un emoji, un titre, une phrase
 * qui dit quoi faire, et les boutons qui vont avec. Juste le contenu, centré et sans fond : c'est l'écran qui le pose
 * (dans une feuille, sur la caméra, dans une carte).
 */
export function MessageEchecVisite({ erreur, details, lieuNom, actions = [], refTitre }: Props) {
  const message = decrireEchecVisite(erreur, details, lieuNom);
  return (
    <View className="items-center">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="mb-3 h-16 w-16 items-center justify-center rounded-full border-2 border-encre bg-jaune"
      >
        <Text className="text-3xl">{message.emoji}</Text>
      </View>
      <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
        {lierPonctuation(message.titre)}
      </Text>
      <Text className="mt-2 text-center font-texte text-base leading-6 text-gris">{lierPonctuation(message.texte)}</Text>
      {actions.length > 0 ? (
        <View className="mt-5 gap-3 self-stretch">
          {actions.map((action) => (
            <Bouton key={action.libelle} libelle={action.libelle} variante={action.variante ?? "jaune"} onPress={action.onPress} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
