import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { QrAffiche } from "@sos-miam/commun/types/comptoir";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

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
  const reste = formaterReste(qr.finitLe, maintenant);
  const scans = `${qr.restantes} scan${qr.restantes > 1 ? "s" : ""} sur ${qr.personnes}`;
  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-encre p-5">
      <View accessible accessibilityLabel={`QR allumé : ${scans} restant${qr.restantes > 1 ? "s" : ""}, il s'éteint dans ${reste}`} className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-jaune">
          <Ionicons name="qr-code" size={30} color={couleurs.encre} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-titre-gras text-xl text-white">QR allumé</Text>
          <Text className="font-texte text-sm text-white/80">
            {scans} restant{qr.restantes > 1 ? "s" : ""} · s'éteint dans {reste}
          </Text>
        </View>
      </View>
      <EtiquettesReglement reglement={reglement} pour="lieu" taille="petite" />
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir le QR en grand"
          onPress={() => {
            vibrerLegerement();
            onVoir();
          }}
          className="min-h-12 flex-1 items-center justify-center rounded-full border-2 border-jaune bg-jaune active:opacity-80"
        >
          <Text className="font-texte-gras text-base text-encre">Voir le QR</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Éteindre le QR"
          onPress={() => {
            vibrerLegerement();
            onCacher();
          }}
          className="min-h-12 flex-1 items-center justify-center rounded-full border-2 border-white/70 active:opacity-80"
        >
          <Text className="font-texte-gras text-base text-white">Éteindre</Text>
        </Pressable>
      </View>
    </View>
  );
}
