import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { type Palette, utiliserTheme } from "~/hooks/utiliser-theme";

export type Fournisseur = "apple" | "google" | "email";

const styles: Record<Fournisseur, { libelle: string; icone: "logo-apple" | "logo-google" | "mail"; fond: string; texte: string; couleurIcone: (palette: Palette) => string }> = {
  // Apple : bouton noir, logo et texte blancs (règles d'Apple)
  apple: { libelle: "Continuer avec Apple", icone: "logo-apple", fond: "bg-nuit border-encre", texte: "text-white", couleurIcone: () => "#FFFFFF" },
  google: { libelle: "Continuer avec Google", icone: "logo-google", fond: "bg-carte border-encre", texte: "text-encre", couleurIcone: (palette) => palette.encre },
  email: { libelle: "Continuer avec mon e-mail", icone: "mail", fond: "bg-jaune border-encre", texte: "text-nuit", couleurIcone: (palette) => palette.nuit },
};

const appleSurFondSombre = { ...styles.apple, fond: "bg-white border-encre", texte: "text-black", couleurIcone: () => "#000000" };

/** Grand bouton de connexion (Apple, Google ou e-mail), tous de la même taille ; `enCours` : la connexion part, il attend. */
export function BoutonConnexion({ fournisseur, onPress, enCours = false, desactive = false }: { fournisseur: Fournisseur; onPress: () => void; enCours?: boolean; desactive?: boolean }) {
  const { schema, couleurs } = utiliserTheme();
  const s = fournisseur === "apple" && schema === "sombre" ? appleSurFondSombre : styles[fournisseur];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.libelle}
      accessibilityState={{ busy: enCours, disabled: desactive || enCours }}
      disabled={desactive || enCours}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 px-5 active:opacity-80 ${s.fond} ${desactive && !enCours ? "opacity-50" : ""}`}
    >
      <Ionicons name={s.icone} size={22} color={s.couleurIcone(couleurs)} />
      <Text className={`font-texte-gras text-[17px] ${s.texte}`}>{enCours ? "Un instant…" : s.libelle}</Text>
    </Pressable>
  );
}
