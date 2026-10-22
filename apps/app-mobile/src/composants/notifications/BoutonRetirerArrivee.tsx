import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  /** La personne arrivée dans ta bande par ton lien ou ton QR code */
  id: string;
  prenom: string;
  onAnnoncer: (texte: string) => void;
};

// Le temps que « Retiré » remplace le bouton avant d'y poser VoiceOver
const DELAI_FOCUS = 250;

/**
 * « Retirer », sous la notification « … a rejoint ta bande » : si ton lien est arrivé chez quelqu'un que tu n'attendais
 * pas, un seul geste la fait sortir de ta bande (sans la prévenir). Le bouton devient « Retiré » et garde sa place. Rien
 * quand la personne n'est plus dans ta bande.
 */
export function BoutonRetirerArrivee({ id, prenom, onAnnoncer }: Props) {
  const { potes, retirerPote } = utiliserCommunaute();
  const [retire, setRetire] = useState(false);
  const texteRetire = useRef<View>(null);
  const dansLaBande = potes.some((p) => p.id === id);

  useEffect(() => {
    if (!retire) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(texteRetire.current), DELAI_FOCUS);
    return () => clearTimeout(minuterie);
  }, [retire]);

  if (retire) {
    return (
      <View ref={texteRetire} accessible accessibilityLabel={`${prenom} n'est plus dans ta bande`} className="mb-3 h-9 min-w-24 items-center justify-center px-3">
        <Text className="font-texte-semi text-[13px] text-gris">Retiré</Text>
      </View>
    );
  }
  if (!dansLaBande) return null;
  return (
    <Pressable
      accessibilityRole="button"
      // Commence par le mot affiché : Commande vocale trouve le bouton (« Toucher Retirer »)
      accessibilityLabel={`Retirer ${prenom} de ta bande`}
      accessibilityHint="Pas toi qui as partagé ton lien ? Un geste et c'est réglé. On ne prévient personne."
      // 36 pt de haut à l'écran, 48 pt sous le doigt
      hitSlop={6}
      onPress={() => {
        vibrerLegerement();
        retirerPote(id);
        setRetire(true);
        onAnnoncer(`${prenom} n'est plus dans ta bande. En toute discrétion 🤫`);
      }}
      className="mb-3 h-9 min-w-24 flex-row items-center justify-center rounded-full border-2 border-encre bg-carte px-3 active:opacity-70"
    >
      <Text className="font-texte-gras text-[13px] text-encre">Retirer</Text>
    </Pressable>
  );
}
