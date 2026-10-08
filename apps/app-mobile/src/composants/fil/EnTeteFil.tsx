import { Platform, Pressable, Text, View } from "react-native";

export type OngletFil = "tous" | "sos";

type Props = {
  onglet: OngletFil;
  onChoisir: (onglet: OngletFil) => void;
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
  /** Marge du haut (zone sûre) */
  haut: number;
};

/** Hauteur de l'en-tête sous la zone sûre : 6 (marge) + 44 (onglets) + 8 (marge du bas) ; ce qui est posé dessous commence après */
export const HAUTEUR_ENTETE_FIL = 58;

// « lu » : le nom de l'onglet pour le lecteur d'écran, sans emoji
const onglets: { cle: OngletFil; libelle: string; lu: string }[] = [
  { cle: "tous", libelle: "Pour toi", lu: "Pour toi" },
  { cle: "sos", libelle: "SOS ce soir 🔥", lu: "SOS ce soir" },
];

/** En-tête posé sur le fil : rescousses restantes, et les deux fils (« Pour toi », « SOS ce soir »). */
export function EnTeteFil({ onglet, onChoisir, restantes, haut }: Props) {
  return (
    <View style={{ paddingTop: haut + 6 }} className="absolute inset-x-0 top-0 flex-row items-center px-4 pb-2">
      <View className="w-16">
        <View
          accessible
          accessibilityLabel={`Il te reste ${restantes} rescousse${restantes > 1 ? "s" : ""} cette semaine`}
          className="flex-row items-center gap-1 self-start rounded-full bg-black/30 px-2.5 py-1.5"
        >
          <Text className="text-base">🛟</Text>
          <Text className="font-texte-gras text-base text-white">{restantes}</Text>
        </View>
      </View>
      <View accessibilityRole="tablist" className="flex-1 flex-row justify-center gap-5">
        {onglets.map(({ cle, libelle, lu }, i) => {
          const actif = cle === onglet;
          // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
          return (
            <Pressable
              key={cle}
              accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
              accessibilityLabel={Platform.OS === "ios" ? `${lu}, onglet ${i + 1} sur ${onglets.length}` : lu}
              accessibilityState={{ selected: actif }}
              hitSlop={8}
              onPress={() => onChoisir(cle)}
              className={`min-h-11 justify-center border-b-[3px] ${actif ? "border-jaune" : "border-transparent"}`}
            >
              <Text
                className={`font-texte-gras text-base ${actif ? "text-white" : "text-white/65"}`}
                style={{ textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4 }}
              >
                {libelle}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="w-16" />
    </View>
  );
}
