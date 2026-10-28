import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { Pressable, Text, View, type AccessibilityActionEvent } from "react-native";

import { formaterPrixLangue } from "@sos-miam/commun/fonctions/langue/formater-prix-langue";
import type { ElementCarte } from "@sos-miam/commun/types/carte";
import { BoutonIconeRond } from "~/composants/interface/BoutonIconeRond";
import { ETIQUETTES_CARTE_PAR_LANGUE } from "~/contenus/etiquettes-carte";
import { TEXTES_EDITION_CARTE_PAR_LANGUE } from "~/contenus/textes-edition-carte";
import { formaterPrixLuLangue } from "~/fonctions/langue/formater-prix-lu-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  element: ElementCarte;
  /** Mode « Ranger » : des flèches pour monter et descendre, et le toucher n'ouvre plus l'élément */
  rangement: boolean;
  premier: boolean;
  dernier: boolean;
  /** Trait fin au-dessus, pour le séparer de l'élément précédent */
  separe: boolean;
  onModifier: () => void;
  onDeplacer: (sens: -1 | 1) => void;
};

/**
 * Une ligne de la carte, côté pro : nom (⭐ si c'est une spécialité), prix et unité, alcool et repères en petit. On la
 * touche pour la modifier ; en mode « Ranger », deux flèches la montent ou la descendent (aussi en actions VoiceOver).
 */
export const LigneElementCartePro = memo(function LigneElementCartePro({ element, rangement, premier, dernier, separe, onModifier, onDeplacer }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_EDITION_CARTE_PAR_LANGUE).ligne;
  const etiquettesCarte = utiliserTextes(ETIQUETTES_CARTE_PAR_LANGUE);
  const etiquettes = element.etiquettes ?? [];
  const prix = element.prix === 0 ? T.gratuit : formaterPrixLangue(element.prix, langue);
  const prixLu = element.prix === 0 ? T.gratuitLu : formaterPrixLuLangue(element.prix, langue);
  const reperes = [element.alcool ? T.alcoolLu : null, ...etiquettes.map((e) => etiquettesCarte[e].lu)].filter(Boolean).join(", ");
  const lu = [element.nom, element.signature ? T.specialiteLu : null, `${prixLu}${element.unite ? ` ${element.unite}` : ""}`, reperes || null].filter(Boolean).join(", ");

  const contenu = (
    <View className="flex-1 gap-1">
      <Text className="font-texte-gras text-base leading-[22px] text-encre">
        {element.signature ? "⭐ " : ""}
        {lierPonctuation(element.nom)}
      </Text>
      <Text className="font-texte-semi text-sm text-encre">
        {prix}
        {element.unite ? <Text className="font-texte text-gris"> · {element.unite}</Text> : null}
      </Text>
      {element.alcool || etiquettes.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {element.alcool ? <Text className="overflow-hidden rounded-full bg-rose-alerte px-2 py-0.5 font-texte-semi text-[11px] text-encre">{T.alcool}</Text> : null}
          {etiquettes.map((e) => (
            <Text key={e} className="overflow-hidden rounded-full bg-jaune-clair px-2 py-0.5 font-texte-moyen text-[11px] text-encre">
              {etiquettesCarte[e].emoji} {etiquettesCarte[e].libelle}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (rangement) {
    return (
      <View className={`flex-row items-center gap-2 py-3 ${separe ? "border-t border-ligne" : ""}`}>
        <View accessible accessibilityLabel={lu} className="flex-1">
          {contenu}
        </View>
        <BoutonIconeRond icone="arrow-up" libelle={T.monterLu(element.nom)} desactive={premier} onPress={() => onDeplacer(-1)} />
        <BoutonIconeRond icone="arrow-down" libelle={T.descendreLu(element.nom)} desactive={dernier} onPress={() => onDeplacer(1)} />
      </View>
    );
  }

  const actions = [...(premier ? [] : [{ name: "monter", label: T.monter }]), ...(dernier ? [] : [{ name: "descendre", label: T.descendre }])];
  const agir = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === "monter") onDeplacer(-1);
    if (e.nativeEvent.actionName === "descendre") onDeplacer(1);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint={T.modifierIndice}
      accessibilityActions={actions}
      onAccessibilityAction={agir}
      onPress={onModifier}
      className={`flex-row items-center gap-3 py-3 active:opacity-70 ${separe ? "border-t border-ligne" : ""}`}
    >
      {contenu}
      <Ionicons name="pencil" size={18} color={couleurs.gris} />
    </Pressable>
  );
});
