import { ScrollView, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { SuggestionsSuivre } from "~/composants/suivi/SuggestionsSuivre";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  hauteur: number;
  /** Ce que l'en-tête du fil couvre en haut (zone sûre comprise) : une bande sombre, sous les onglets */
  margeHaut: number;
  /** La barre d'onglets, posée par-dessus le fil */
  margeBas: number;
  /** « Retour à Pour toi » */
  onVoirTout: () => void;
  onAnnoncer: (texte: string) => void;
};

const TYPES_PAGES = ["createur", "lieu"] as const;

/**
 * Onglet « Abonnements » du fil sans aucune publication : ce qui arrivera ici, des créateurs et des lieux à suivre
 * (dès qu'on en suit un qui a publié, sa vidéo remplace cet écran), et le retour à « Pour toi ».
 * Lit lui-même les suivis entre personnes : l'écran du fil ne se redessine pas pour eux.
 */
export function FilVideAbonnements({ hauteur, margeHaut, margeBas, onVoirTout, onAnnoncer }: Props) {
  const { pret, abonnements } = utiliserSuivisPersonnes();
  const suitDesPersonnes = pret && abonnements.length > 0;

  return (
    <View style={{ height: hauteur }} className="bg-jaune">
      {/* Les onglets du fil sont blancs : ils restent lisibles sur cette bande */}
      <View style={{ height: margeHaut }} className="bg-encre" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pt-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: margeBas + 24 }}
      >
        <View className="items-center gap-3">
          <Mascotte expression="clin" taille={110} />
          <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
            {lierPonctuation("Ton fil Abonnements fait la sieste 😴")}
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-encre/80">
            {lierPonctuation("Suis des lieux et des créateurs : leurs vidéos arriveront ici.")}
          </Text>
          {suitDesPersonnes ? (
            <Text className="text-center font-texte text-base leading-6 text-encre/80">
              {lierPonctuation("Les personnes que tu suis ne publient pas encore de vidéos : leurs listes t'attendent dans Potes.")}
            </Text>
          ) : null}
        </View>
        <SuggestionsSuivre titre="Tu pourrais suivre" types={TYPES_PAGES} onAnnoncer={onAnnoncer} />
        <Bouton libelle="Retour à Pour toi" variante="blanc" indice="Revient au fil de toutes les adresses" onPress={onVoirTout} className="mt-2 self-stretch" />
      </ScrollView>
    </View>
  );
}
