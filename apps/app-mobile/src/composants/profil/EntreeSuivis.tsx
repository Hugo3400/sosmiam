import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Clés des lieux et créateurs suivis (calculerCleSuivi) */
  suivis: readonly string[];
  age: number;
};

/** La rangée « 🔔 Tu suis » du profil, avec le compte des lieux et créateurs suivis ; elle ouvre la liste pour les retrouver ou ne plus les suivre. */
export function EntreeSuivis({ suivis, age }: Props) {
  const router = useRouter();
  // Comptés comme dans la liste « Tu suis » : ce qui existe encore et que ton âge autorise
  const affichables = listerSuivisAffichables(suivis, filtrerLieuxSelonAge(lieuxExemples, age));
  const nombreLieux = affichables.filter((s) => s.type === "lieu").length;
  const nombreCreateurs = affichables.length - nombreLieux;

  const parties = [
    nombreLieux > 0 ? `${nombreLieux} lieu${nombreLieux > 1 ? "x" : ""}` : null,
    nombreCreateurs > 0 ? `${nombreCreateurs} créateur${nombreCreateurs > 1 ? "s" : ""}` : null,
  ].filter((p) => p !== null);
  const detail = parties.length > 0 ? parties.join(" et ") : "Personne pour l'instant : touche « Suivre » sur une fiche ou une vidéo";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={parties.length > 0 ? `Tu suis ${detail}` : `Tu suis, personne pour l'instant`}
      accessibilityHint="Ouvre la liste des lieux et créateurs que tu suis"
      onPress={() => {
        vibrerLegerement();
        router.push("/suivis");
      }}
      className="min-h-16 flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white px-4 py-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune">
        <Text className="text-xl">🔔</Text>
      </View>
      <View className="flex-1">
        <Text className="font-texte-gras text-base text-encre">Tu suis</Text>
        <Text className="font-texte text-sm text-gris">{lierPonctuation(detail)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
    </Pressable>
  );
}
