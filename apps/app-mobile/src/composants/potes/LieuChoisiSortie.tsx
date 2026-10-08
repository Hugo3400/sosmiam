import { Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { Bouton } from "~/composants/interface/Bouton";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  lieu: Lieu;
  image: ImageSourcePropType | null;
  km: number;
  /** Votes qu'il a reçus */
  votes: number;
  onFiche: () => void;
  onItineraire: () => void;
};

/** Le vote est fini : le lieu retenu en grand, « On y va ! », et de quoi s'y rendre. */
export function LieuChoisiSortie({ lieu, image, km, votes, onFiche, onItineraire }: Props) {
  const detailVotes = votes === 0 ? "Personne n'a voté, alors on a pris le premier proposé." : `${votes} vote${votes > 1 ? "s" : ""}, la bande a parlé.`;
  return (
    <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
      <VignetteLieu lieu={lieu} image={image} hauteur={150} largeur="100%" arrondi={0} />
      <View className="gap-1 p-4">
        <Text accessibilityRole="header" accessibilityLabel={`On y va ! Le lieu retenu : ${lieu.nom}`} className="font-titre text-[28px] leading-[32px] text-encre">
          {lierPonctuation("On y va ! 🎉")}
        </Text>
        <Text className="font-texte-gras text-lg text-encre">{lieu.nom}</Text>
        <Text className="font-texte text-[15px] text-gris">
          {lieu.info} · {lieu.quartier}, {lieu.ville} · {formaterDistance(km)}
        </Text>
        <Text className="font-texte text-sm text-gris">{lierPonctuation(detailVotes)}</Text>
        <View className="mt-3 flex-row gap-3">
          <Bouton className="flex-1" petit libelle="La fiche du lieu" variante="blanc" onPress={onFiche} indice="Horaires, plat signature et adresse" />
          <Bouton className="flex-1" petit libelle="Itinéraire" onPress={onItineraire} indice="Ouvre l'itinéraire dans ton appli de cartes" />
        </View>
      </View>
    </View>
  );
}
