import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View, type AccessibilityActionEvent } from "react-native";

import type { ElementCarte } from "@sos-miam/commun/types/carte";
import { BoutonIconeRond } from "~/composants/interface/BoutonIconeRond";
import { etiquettesCarte } from "~/contenus/etiquettes-carte";
import { formaterPrix } from "~/fonctions/prix/formater-prix";
import { formaterPrixLu } from "~/fonctions/prix/formater-prix-lu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

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
  const etiquettes = element.etiquettes ?? [];
  const prix = element.prix === 0 ? "Gratuit" : formaterPrix(element.prix);
  const prixLu = element.prix === 0 ? "gratuit" : formaterPrixLu(element.prix);
  const reperes = [element.alcool ? "contient de l'alcool, caché aux moins de 18 ans" : null, ...etiquettes.map((e) => etiquettesCarte[e].lu)].filter(Boolean).join(", ");
  const lu = [element.nom, element.signature ? "spécialité de la maison" : null, `${prixLu}${element.unite ? ` ${element.unite}` : ""}`, reperes || null].filter(Boolean).join(", ");

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
          {element.alcool ? <Text className="overflow-hidden rounded-full bg-rose-alerte px-2 py-0.5 font-texte-semi text-[11px] text-encre">🍷 Alcool · 18+</Text> : null}
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
        <BoutonIconeRond icone="arrow-up" libelle={`Monter ${element.nom}`} desactive={premier} onPress={() => onDeplacer(-1)} />
        <BoutonIconeRond icone="arrow-down" libelle={`Descendre ${element.nom}`} desactive={dernier} onPress={() => onDeplacer(1)} />
      </View>
    );
  }

  const actions = [...(premier ? [] : [{ name: "monter", label: "Monter" }]), ...(dernier ? [] : [{ name: "descendre", label: "Descendre" }])];
  const agir = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === "monter") onDeplacer(-1);
    if (e.nativeEvent.actionName === "descendre") onDeplacer(1);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint="Touche pour le modifier ou le retirer"
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
