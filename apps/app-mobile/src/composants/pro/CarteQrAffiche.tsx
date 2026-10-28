import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { QrAffiche } from "@sos-miam/commun/types/comptoir";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { TEXTES_QR_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-qr-comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  qr: QrAffiche;
  /** Comment la table a réglé (choisi en montrant le QR) : vaut pour chacune de ses visites */
  reglement?: ReglementVisite | null;
  maintenant: Date;
  onVoir: () => void;
  onCacher: () => void;
};

/** « 1:12 » avant que le QR s'éteigne tout seul */
function formaterReste(finitLe: string, maintenant: Date): string {
  const secondes = Math.max(0, Math.ceil((Date.parse(finitLe) - maintenant.getTime()) / 1000));
  return `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, "0")}`;
}

/** Le QR est allumé : pour combien de personnes, combien de scans restent, quand il s'éteint, et de quoi le revoir ou le cacher. */
export function CarteQrAffiche({ qr, reglement = null, maintenant, onVoir, onCacher }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_QR_COMPTOIR_PAR_LANGUE);
  const reste = formaterReste(qr.finitLe, maintenant);
  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-nuit p-5">
      <View accessible accessibilityLabel={T.allumeLu(qr.restantes, qr.personnes, reste)} className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-jaune">
          <Ionicons name="qr-code" size={30} color={couleurs.nuit} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-titre-gras text-xl text-white">{T.allume}</Text>
          <Text className="font-texte text-sm text-white/80">{T.allumeDetail(qr.restantes, qr.personnes, reste)}</Text>
        </View>
      </View>
      <EtiquettesReglement reglement={reglement} pour="lieu" taille="petite" />
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.voirLu}
          onPress={() => {
            vibrerLegerement();
            onVoir();
          }}
          className="min-h-12 flex-1 items-center justify-center rounded-full border-2 border-jaune bg-jaune active:opacity-80"
        >
          <Text className="font-texte-gras text-base text-nuit">{T.voir}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.eteindreLu}
          onPress={() => {
            vibrerLegerement();
            onCacher();
          }}
          className="min-h-12 flex-1 items-center justify-center rounded-full border-2 border-white/70 active:opacity-80"
        >
          <Text className="font-texte-gras text-base text-white">{T.eteindre}</Text>
        </Pressable>
      </View>
    </View>
  );
}
