import { useRef, useState } from "react";
import { PanResponder, View, type AccessibilityActionEvent } from "react-native";

import { BoutonIconeRond } from "~/composants/interface/BoutonIconeRond";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  valeur: number;
  min: number;
  max: number;
  /** Appelé à chaque cran pendant qu'on glisse, et à chaque − / + */
  onChanger: (valeur: number) => void;
  /** Ce que règle le curseur, lu par VoiceOver et TalkBack : « Rayon » */
  libelle: string;
  /** La valeur telle qu'on la dit : « 12 kilomètres » */
  dire: (valeur: number) => string;
};

/** Le rond qu'on fait glisser (points) */
const ROND = 32;

/**
 * Un curseur SOS Miam, sans module natif : une barre qu'on touche ou fait glisser (au cran près), et deux boutons − et +
 * pour ajuster d'un cran. Pour VoiceOver et TalkBack, un seul élément « réglable » (glisser vers le haut ou le bas).
 */
export function Curseur({ valeur, min, max, onChanger, libelle, dire }: Props) {
  const [largeur, setLargeur] = useState(0);
  // Où le doigt a touché la barre, et la dernière valeur dite (pour ne vibrer qu'en changeant de cran)
  const depart = useRef(0);
  const derniere = useRef(valeur);
  derniere.current = valeur;
  const lecture = useRef({ largeur, min, max, onChanger });
  lecture.current = { largeur, min, max, onChanger };

  const borner = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const part = max > min ? (valeur - min) / (max - min) : 0;

  const choisirA = (x: number) => {
    const { largeur: l, min: bas, max: haut, onChanger: changer } = lecture.current;
    if (l <= ROND) return;
    const v = Math.min(haut, Math.max(bas, Math.round(bas + ((x - ROND / 2) / (l - ROND)) * (haut - bas))));
    if (v !== derniere.current) {
      derniere.current = v;
      changer(v);
    }
  };

  const gestes = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Dans une feuille qui défile, un glissé de côté reste au curseur
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        depart.current = e.nativeEvent.locationX;
        choisirA(depart.current);
      },
      onPanResponderMove: (_, g) => choisirA(depart.current + g.dx),
      onPanResponderRelease: () => vibrerLegerement(),
    }),
  ).current;

  const ajuster = (cran: number) => {
    const v = borner(valeur + cran);
    if (v !== valeur) onChanger(v);
  };
  const agir = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === "increment") ajuster(1);
    if (e.nativeEvent.actionName === "decrement") ajuster(-1);
  };

  return (
    <View className="flex-row items-center gap-3">
      <BoutonIconeRond icone="remove" libelle={`Moins, ${dire(borner(valeur - 1))}`} desactive={valeur <= min} onPress={() => ajuster(-1)} />
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={libelle}
        accessibilityValue={{ min, max, now: valeur, text: dire(valeur) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={agir}
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
        className="h-12 flex-1 justify-center"
        {...gestes.panHandlers}
      >
        <View pointerEvents="none" className="h-2 overflow-hidden rounded-full bg-ligne" style={{ marginHorizontal: ROND / 2 }}>
          <View className="h-2 bg-encre" style={{ width: `${part * 100}%` }} />
        </View>
        <View
          pointerEvents="none"
          className="absolute rounded-full border-2 border-encre bg-jaune"
          style={{ width: ROND, height: ROND, left: part * Math.max(0, largeur - ROND) }}
        />
      </View>
      <BoutonIconeRond icone="add" libelle={`Plus, ${dire(borner(valeur + 1))}`} desactive={valeur >= max} onPress={() => ajuster(1)} />
    </View>
  );
}
