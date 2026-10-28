import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "react-native";

import { TEXTES_INSCRIPTION_ACCUEIL_PAR_LANGUE } from "~/contenus/textes-inscription-accueil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { type Palette, utiliserTheme } from "~/hooks/utiliser-theme";

export type Fournisseur = "apple" | "google" | "email";

const styles: Record<Fournisseur, { icone: "logo-apple" | "logo-google" | "mail"; fond: string; texte: string; couleurIcone: (palette: Palette) => string }> = {
  // Apple : bouton noir, logo et texte blancs (règles d'Apple)
  apple: { icone: "logo-apple", fond: "bg-nuit border-encre", texte: "text-white", couleurIcone: () => "#FFFFFF" },
  google: { icone: "logo-google", fond: "bg-carte border-encre", texte: "text-encre", couleurIcone: (palette) => palette.encre },
  email: { icone: "mail", fond: "bg-jaune border-encre", texte: "text-nuit", couleurIcone: (palette) => palette.nuit },
};

const appleSurFondSombre = { ...styles.apple, fond: "bg-white border-encre", texte: "text-black", couleurIcone: () => "#000000" };

/** Grand bouton de connexion (Apple, Google ou e-mail), tous de la même taille ; `enCours` : la connexion part, il attend. */
export function BoutonConnexion({ fournisseur, onPress, enCours = false, desactive = false }: { fournisseur: Fournisseur; onPress: () => void; enCours?: boolean; desactive?: boolean }) {
  const { schema, couleurs } = utiliserTheme();
  const T = utiliserTextes(TEXTES_INSCRIPTION_ACCUEIL_PAR_LANGUE);
  const s = fournisseur === "apple" && schema === "sombre" ? appleSurFondSombre : styles[fournisseur];
  const libelle = T.connexion[fournisseur];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ busy: enCours, disabled: desactive || enCours }}
      disabled={desactive || enCours}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 px-5 active:opacity-80 ${s.fond} ${desactive && !enCours ? "opacity-50" : ""}`}
    >
      <Ionicons name={s.icone} size={22} color={s.couleurIcone(couleurs)} />
      <Text className={`font-texte-gras text-[17px] ${s.texte}`}>{enCours ? T.unInstant : libelle}</Text>
    </Pressable>
  );
}
