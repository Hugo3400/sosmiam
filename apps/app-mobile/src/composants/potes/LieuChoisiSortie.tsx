import { Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_VOTE_SORTIE_PAR_LANGUE } from "~/contenus/textes-vote-sortie";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieu: Lieu;
  image: ImageSourcePropType | null;
  /** Sa distance depuis ta ville ; null si on ne la connaît pas : rien ne s'affiche */
  km: number | null;
  /** Votes qu'il a reçus */
  votes: number;
  onFiche: () => void;
  onItineraire: () => void;
};

/** Le vote est fini : le lieu retenu en grand, « On y va ! », et de quoi s'y rendre. */
export function LieuChoisiSortie({ lieu, image, km, votes, onFiche, onItineraire }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_VOTE_SORTIE_PAR_LANGUE).lieuChoisi;
  const detailVotes = votes === 0 ? T.detailAucunVote : T.detailVotes(votes);
  return (
    <View className="overflow-hidden rounded-carte border-2 border-encre bg-carte">
      <VignetteLieu lieu={lieu} image={image} hauteur={150} largeur="100%" arrondi={0} />
      <View className="gap-1 p-4">
        <Text accessibilityRole="header" accessibilityLabel={T.titreLu(lieu.nom)} className="font-titre text-[28px] leading-[32px] text-encre">
          {lierPonctuation(T.titre)}
        </Text>
        <Text className="font-texte-gras text-lg text-encre">{lieu.nom}</Text>
        <Text className="font-texte text-[15px] text-gris">
          {lieu.info} · {ecrireQuartierVille(lieu)}
          {km === null ? "" : ` · ${formaterDistanceLangue(km, langue)}`}
        </Text>
        <Text className="font-texte text-sm text-gris">{lierPonctuation(detailVotes)}</Text>
        <View className="mt-3 flex-row gap-3">
          <Bouton className="flex-1" petit libelle={T.fiche} variante="blanc" onPress={onFiche} indice={T.ficheIndice} />
          <Bouton className="flex-1" petit libelle={T.itineraire} onPress={onItineraire} indice={T.itineraireIndice} />
        </View>
      </View>
    </View>
  );
}
