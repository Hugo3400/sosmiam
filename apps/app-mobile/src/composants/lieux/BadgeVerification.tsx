import { Text, View } from "react-native";

type Props = {
  verifie: boolean;
  taille?: "petite" | "normale";
};

/**
 * « ✓ Vérifié » (le lieu a un compte SOS Miam : il valide les visites, lance des SOS, répond aux avis) ou « Non vérifié »
 * (ajouté par l'équipe ou un ambassadeur, sans compte) : dit clairement partout, pour ne jamais laisser croire qu'il est inscrit.
 */
export function BadgeVerification({ verifie, taille = "normale" }: Props) {
  const petite = taille === "petite";
  const lu = verifie ? "Lieu vérifié : il a un compte SOS Miam" : "Lieu non vérifié : il n'a pas encore de compte SOS Miam";
  return (
    <View
      accessible
      accessibilityLabel={lu}
      className={`flex-row items-center self-start rounded-full border-2 ${verifie ? `border-encre bg-nuit ${petite ? "px-1.5" : "px-2.5 py-0.5"}` : `border-dashed border-gris/60 bg-carte ${petite ? "px-2 py-0.5" : "px-3 py-1"}`}`}
    >
      <Text className={`font-texte-gras ${petite ? "text-[11px]" : "text-[13px]"} ${verifie ? "text-jaune" : "text-gris"}`}>{verifie ? "✓ Vérifié" : "Non vérifié"}</Text>
    </View>
  );
}
