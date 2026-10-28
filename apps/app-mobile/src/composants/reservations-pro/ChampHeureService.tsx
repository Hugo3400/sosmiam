import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { TEXTES_FEUILLE_SERVICE_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  libelle: string;
  valeur: string;
  ouvert: boolean;
  aide?: string;
  erreur?: string | null;
  onBasculer: () => void;
};

export function ChampHeureService({ libelle, valeur, ouvert, aide, erreur, onBasculer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_FEUILLE_SERVICE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const heure = formaterHeureTexteLangue(valeur, langue);
  const message = erreur ?? aide;
  return (
    <View className="gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${remplirModele(T.heureChoisie, { champ: libelle, heure })}${erreur ? `. ${erreur}` : ""}`}
        accessibilityHint={T.changerHeureIndice}
        accessibilityState={{ expanded: ouvert }}
        onPress={() => {
          vibrerLegerement();
          onBasculer();
        }}
        className={`min-h-14 flex-row items-center justify-between rounded-2xl border-2 bg-carte px-4 py-2 active:opacity-80 ${erreur ? "border-tomate" : "border-encre"}`}
      >
        <Text className="font-texte-semi text-base text-encre">{libelle}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="font-titre text-2xl text-encre">{heure}</Text>
          <Ionicons name={ouvert ? "chevron-up" : "chevron-down"} size={18} color={couleurs.encre} />
        </View>
      </Pressable>
      {message ? <Text className={`font-texte text-[13px] leading-[18px] ${erreur ? "text-rouge-texte" : "text-gris"}`}>{lierPonctuation(message)}</Text> : null}
    </View>
  );
}
