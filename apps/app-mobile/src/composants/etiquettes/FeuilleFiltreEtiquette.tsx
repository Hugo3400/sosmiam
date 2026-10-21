import { Platform, Pressable, Text, View } from "react-native";

import { ETIQUETTES_FILTRE_EXPLORER } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { TEXTES_ETIQUETTES as T } from "~/contenus/textes-etiquettes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  visible: boolean;
  choisie: string | null;
  onChoisir: (nom: string | null) => void;
  onFermer: () => void;
};

const CHOIX: readonly { nom: string | null; libelle: string }[] = [{ nom: null, libelle: T.filtreToutes }, ...ETIQUETTES_FILTRE_EXPLORER.map((nom) => ({ nom, libelle: nom }))];

export function FeuilleFiltreEtiquette({ visible, choisie, onChoisir, onFermer }: Props) {
  const ios = Platform.OS === "ios";
  return (
    <FeuilleBas visible={visible} titre={T.filtreTitre} sousTitre={T.filtreSousTitre} onFermer={onFermer} pied={<Bouton libelle={T.filtreFermer} variante="blanc" onPress={onFermer} />}>
      <View accessibilityRole="radiogroup" accessibilityLabel={T.filtreTitre} className="flex-row flex-wrap gap-2">
        {CHOIX.map((choix, i) => {
          const actif = choix.nom === choisie;
          return (
            <Pressable
              key={choix.libelle}
              accessibilityRole={ios ? "button" : "radio"}
              accessibilityState={ios ? { selected: actif } : { checked: actif }}
              accessibilityLabel={ios ? `${choix.libelle}, ${i + 1} sur ${CHOIX.length}` : choix.libelle}
              onPress={() => {
                vibrerLegerement();
                onChoisir(choix.nom);
              }}
              className={`min-h-11 justify-center rounded-full border-2 border-encre px-4 active:opacity-80 ${actif ? "bg-encre" : "bg-white"}`}
            >
              <Text className={`font-texte-semi text-[14px] ${actif ? "text-jaune" : "text-encre"}`}>{choix.libelle}</Text>
            </Pressable>
          );
        })}
      </View>
    </FeuilleBas>
  );
}
