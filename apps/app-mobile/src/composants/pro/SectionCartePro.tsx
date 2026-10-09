import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { SectionCarte } from "@sos-miam/commun/types/carte";
import { BoutonIconeRond } from "~/composants/interface/BoutonIconeRond";
import { LigneElementCartePro } from "~/composants/pro/LigneElementCartePro";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  section: SectionCarte;
  index: number;
  total: number;
  rangement: boolean;
  /** Une sortie (escape game, paddle…) a des formules plutôt que des plats */
  formules: boolean;
  onRenommer: () => void;
  onDeplacer: (sens: -1 | 1) => void;
  onAjouter: () => void;
  onModifierElement: (index: number) => void;
  onDeplacerElement: (index: number, sens: -1 | 1) => void;
};

/**
 * Une section de la carte, côté pro : son titre (à renommer, ou à ranger avec des flèches), ses éléments, et de quoi en
 * ajouter un à la fin. Une section vide le dit gentiment.
 */
export function SectionCartePro({ section, index, total, rangement, formules, onRenommer, onDeplacer, onAjouter, onModifierElement, onDeplacerElement }: Props) {
  const nombre = section.elements.length;
  const quoi = formules ? "une formule" : "un plat ou une boisson";

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-titre-gras text-[22px] leading-7 text-encre">
            {lierPonctuation(section.titre)}
          </Text>
          <Text className="font-texte text-[13px] text-gris">{nombre === 0 ? "Vide pour l'instant" : `${nombre} sur la carte`}</Text>
        </View>
        {rangement ? (
          <>
            <BoutonIconeRond icone="arrow-up" libelle={`Monter la section ${section.titre}`} desactive={index === 0} onPress={() => onDeplacer(-1)} />
            <BoutonIconeRond icone="arrow-down" libelle={`Descendre la section ${section.titre}`} desactive={index === total - 1} onPress={() => onDeplacer(1)} />
          </>
        ) : (
          <BoutonIconeRond icone="pencil" libelle={`Renommer ou retirer la section ${section.titre}`} onPress={onRenommer} />
        )}
      </View>

      <View className="rounded-carte border-2 border-encre bg-white px-4 py-1">
        {section.elements.map((element, rang) => (
          <LigneElementCartePro
            key={`${rang}-${element.nom}`}
            element={element}
            rangement={rangement}
            premier={rang === 0}
            dernier={rang === nombre - 1}
            separe={rang > 0}
            onModifier={() => onModifierElement(rang)}
            onDeplacer={(sens) => onDeplacerElement(rang, sens)}
          />
        ))}
        {rangement ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ajouter ${quoi} dans ${section.titre}`}
            onPress={() => {
              vibrerLegerement();
              onAjouter();
            }}
            className={`min-h-12 flex-row items-center gap-2 py-3 active:opacity-70 ${nombre > 0 ? "border-t border-ligne" : ""}`}
          >
            <View className="h-7 w-7 items-center justify-center rounded-full bg-jaune">
              <Ionicons name="add" size={18} color={couleurs.encre} />
            </View>
            <Text className="font-texte-gras text-[15px] text-encre">Ajouter {quoi}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
