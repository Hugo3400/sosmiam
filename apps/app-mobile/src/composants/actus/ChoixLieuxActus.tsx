import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { LIEUX_RUBRIQUE_ACTUS, type RubriqueActus } from "@sos-miam/commun/regles/actus";
import type { LieuCiteActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { LigneLieuChoisiActus } from "~/composants/actus/LigneLieuChoisiActus";
import type { TEXTES_ECRIRE_ACTUS } from "~/contenus/textes-ecrire-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  rubrique: RubriqueActus;
  lieux: readonly LieuCiteActus[];
  erreur: string | null;
  T: Traduction<typeof TEXTES_ECRIRE_ACTUS>["formulaire"];
  onAjouter: () => void;
  onChanger: (ids: number[]) => void;
};

export function ChoixLieuxActus({ rubrique, lieux, erreur, T, onAjouter, onChanger }: Props) {
  const couleurs = utiliserCouleurs();
  const { min, max } = LIEUX_RUBRIQUE_ACTUS[rubrique];
  const ordonne = rubrique === "top-quartier" || rubrique === "recit-sortie";
  const ids = lieux.map((l) => l.id);

  function deplacer(index: number, sens: -1 | 1) {
    const suivants = [...ids];
    [suivants[index], suivants[index + sens]] = [suivants[index + sens], suivants[index]];
    onChanger(suivants);
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-texte-semi text-base text-encre">{T.lieux[rubrique]}</Text>
        <Text className="font-texte text-[13px] text-gris">{T.lieuxCompte(lieux.length, min, max)}</Text>
      </View>
      {lieux.map((lieu, i) => (
        <LigneLieuChoisiActus
          key={lieu.id}
          lieu={lieu}
          rang={rubrique === "top-quartier" ? i + 1 : null}
          peutMonter={ordonne && i > 0}
          peutDescendre={ordonne && i < lieux.length - 1}
          T={T}
          onMonter={() => deplacer(i, -1)}
          onDescendre={() => deplacer(i, 1)}
          onRetirer={() => onChanger(ids.filter((id) => id !== lieu.id))}
        />
      ))}
      {lieux.length < max ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAjouter}
          className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-carte active:opacity-80 ${erreur ? "border-rouge-texte" : "border-encre"}`}
        >
          <Ionicons name="add" size={20} color={couleurs.encre} />
          <Text className="font-texte-gras text-sm text-encre">{T.ajouterLieu}</Text>
        </Pressable>
      ) : null}
      <Text className={`font-texte text-sm leading-5 ${erreur ? "text-rouge-texte" : "text-gris"}`}>{erreur ?? T.lieuxAide[rubrique]}</Text>
    </View>
  );
}
