import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { SectionCarte } from "@sos-miam/commun/types/carte";
import { BoutonIconeRond } from "~/composants/interface/BoutonIconeRond";
import { LigneElementCartePro } from "~/composants/pro/LigneElementCartePro";
import { TEXTES_EDITION_CARTE_PAR_LANGUE } from "~/contenus/textes-edition-carte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  /** Clé stable d'un élément (utiliserBrouillonCarte) : déplacé, il garde sa ligne et VoiceOver sa place */
  cle: (element: object) => string;
};

/**
 * Une section de la carte, côté pro : son titre (à renommer, ou à ranger avec des flèches), ses éléments, et de quoi en
 * ajouter un à la fin. Une section vide le dit gentiment.
 */
export function SectionCartePro({ section, index, total, rangement, formules, onRenommer, onDeplacer, onAjouter, onModifierElement, onDeplacerElement, cle }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_EDITION_CARTE_PAR_LANGUE).sectionPro;
  const nombre = section.elements.length;
  const quoi = formules ? T.quoiFormule : T.quoiPlat;

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-titre-gras text-[22px] leading-7 text-encre">
            {lierPonctuation(section.titre)}
          </Text>
          <Text className="font-texte text-[13px] text-gris">{nombre === 0 ? T.vide : T.nombre(nombre)}</Text>
        </View>
        {rangement ? (
          <>
            <BoutonIconeRond icone="arrow-up" libelle={T.monterLu(section.titre)} desactive={index === 0} onPress={() => onDeplacer(-1)} />
            <BoutonIconeRond icone="arrow-down" libelle={T.descendreLu(section.titre)} desactive={index === total - 1} onPress={() => onDeplacer(1)} />
          </>
        ) : (
          <BoutonIconeRond icone="pencil" libelle={T.renommerLu(section.titre)} onPress={onRenommer} />
        )}
      </View>

      <View className="rounded-carte border-2 border-encre bg-carte px-4 py-1">
        {section.elements.map((element, rang) => (
          <LigneElementCartePro
            key={cle(element)}
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
            accessibilityLabel={T.ajouterLu(quoi, section.titre)}
            onPress={() => {
              vibrerLegerement();
              onAjouter();
            }}
            className={`min-h-12 flex-row items-center gap-2 py-3 active:opacity-70 ${nombre > 0 ? "border-t border-ligne" : ""}`}
          >
            <View className="h-7 w-7 items-center justify-center rounded-full bg-jaune">
              <Ionicons name="add" size={18} color={couleurs.nuit} />
            </View>
            <Text className="font-texte-gras text-[15px] text-encre">{T.ajouter(quoi)}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
