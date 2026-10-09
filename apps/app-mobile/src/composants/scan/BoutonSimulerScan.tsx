import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { LIEU_DEMO_PRO_ID } from "~/contenus/lieu-demo-pro";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserOutilsDemo } from "~/hooks/utiliser-services";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";

type Props = {
  /** Le texte du QR « scanné » : il suit le même chemin qu'un vrai scan */
  onTexte: (texte: string) => void;
  desactive?: boolean;
};

// Le lieu qui montre son QR quand le mode pro de démo n'en affiche aucun : celui du mode pro (et de ta carte à 4 tampons)
const LIEU_DEMO = LIEU_DEMO_PRO_ID;

/**
 * Démo seulement : simule un scan du comptoir. Si le mode pro de démo montre déjà un QR, on « scanne » celui-là ;
 * sinon, un lieu d'exemple en montre un. Rien en dehors de la démo (le composant ne s'affiche pas).
 */
export function BoutonSimulerScan({ onTexte, desactive = false }: Props) {
  const outils = utiliserOutilsDemo();
  const [qrActif, setQrActif] = useState(false);
  const [occupe, setOccupe] = useState(false);

  // Relu à chaque retour sur l'écran : le mode pro a peut-être montré un QR entre-temps
  useFocusEffect(
    useCallback(() => {
      let actif = true;
      outils
        ?.texteQrActif()
        .then((qr) => actif && setQrActif(qr !== null))
        .catch(() => {});
      return () => {
        actif = false;
      };
    }, [outils]),
  );

  if (!outils) return null;
  const nomLieu = lieuxExemples.find((l) => l.id === LIEU_DEMO)?.nom ?? "un lieu d'exemple";
  const libelle = qrActif ? "Simuler un scan du comptoir" : `Montrer un QR ${direChezLieu(nomLieu)} et le scanner`;

  async function simuler() {
    if (!outils || occupe || desactive) return;
    vibrerLegerement();
    setOccupe(true);
    try {
      const qr = await outils.texteQrActif();
      onTexte(qr?.texte ?? (await outils.montrerQrPour(LIEU_DEMO)));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <View className="items-center gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Démo : ${libelle}`}
        accessibilityState={{ disabled: desactive || occupe }}
        disabled={desactive || occupe}
        onPress={simuler}
        className={`min-h-12 flex-row items-center gap-2 rounded-full border-2 border-dashed border-jaune bg-black/50 px-5 active:opacity-80 ${desactive || occupe ? "opacity-50" : ""}`}
      >
        <Text className="text-base">🧪</Text>
        <Text className="font-texte-gras text-[15px] text-jaune">{libelle}</Text>
      </Pressable>
      <Text className="font-texte text-xs text-white/70">Démo : aucun vrai lieu n'est prévenu</Text>
    </View>
  );
}
